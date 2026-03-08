import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Zap, ZapOff, ChevronLeft, ChevronRight, Radio, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CriticalNode {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  severity: string;
  confidence: number;
  report_count: number;
  last_outage: string | null;
}

interface AiEvent {
  id: string;
  node_name: string | null;
  city: string | null;
  state: string | null;
  event_type: string;
  severity: string;
  confidence: number;
  source_snippet: string | null;
  source_platform: string | null;
  source_handle: string | null;
  source_url: string | null;
  signal_count: number;
  created_at: string;
}

const platformIcons: Record<string, string> = {
  twitter: '𝕏',
  facebook: 'FB',
  reddit: 'R',
  news: '📰',
  forum: '💬',
};

export default function CriticalAlertsCarousel() {
  const [criticalNodes, setCriticalNodes] = useState<CriticalNode[]>([]);
  const [recentEvents, setRecentEvents] = useState<AiEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [nodesRes, eventsRes] = await Promise.all([
      supabase
        .from('nodes')
        .select('id, name, city, state, status, severity, confidence, report_count, last_outage')
        .in('severity', ['CRITICAL', 'HIGH'])
        .order('confidence', { ascending: false })
        .limit(20),
      supabase
        .from('ai_events')
        .select('id, node_name, city, state, event_type, severity, confidence, source_snippet, source_platform, source_handle, source_url, signal_count, created_at')
        .in('severity', ['CRITICAL', 'HIGH'])
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (nodesRes.data) setCriticalNodes(nodesRes.data as CriticalNode[]);
    if (eventsRes.data) setRecentEvents(eventsRes.data as AiEvent[]);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    const channel = supabase
      .channel('critical-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes', filter: 'severity=in.(CRITICAL,HIGH)' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_events' }, () => fetchData())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => {
    if (criticalNodes.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % criticalNodes.length), 5000);
    return () => clearInterval(timer);
  }, [criticalNodes.length]);

  if (criticalNodes.length === 0 && recentEvents.length === 0) return null;

  const currentNode = criticalNodes[currentIndex];

  const timeAgo = (t: string) => {
    const mins = Math.round((Date.now() - new Date(t).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  const getDurationText = (lastOutage: string | null) => {
    if (!lastOutage) return 'Unknown';
    const hours = Math.round((Date.now() - new Date(lastOutage).getTime()) / 3600000);
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  const getIssueType = (node: CriticalNode) => {
    const event = recentEvents.find((e) => e.city === node.city || e.node_name === node.name);
    if (event?.event_type === 'TRANSFORMER_FAILURE') return 'Transformer Failure';
    if (event?.event_type === 'FEEDER_FAILURE') return 'Feeder Failure';
    if (event?.event_type === 'INFRASTRUCTURE_FAILURE') return 'Infrastructure Failure';
    if (node.status === 'OUTAGE') return 'Power Outage';
    if (node.status === 'INTERMITTENT') return 'Grid Instability';
    return 'Electricity Issue';
  };

  const severityColor = (severity: string) => {
    if (severity === 'CRITICAL') return 'text-destructive';
    if (severity === 'HIGH') return 'text-warning';
    return 'text-muted-foreground';
  };

  const prev = () => setCurrentIndex((i) => (i - 1 + criticalNodes.length) % criticalNodes.length);
  const next = () => setCurrentIndex((i) => (i + 1) % criticalNodes.length);

  return (
    <div className="absolute top-4 left-16 z-[1000] max-w-[340px]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card rounded-t-lg w-full px-3 py-2 flex items-center gap-2 hover:bg-accent/30 transition-colors"
      >
        <div className="relative">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          {criticalNodes.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-[7px] font-bold text-destructive-foreground flex items-center justify-center">
              {criticalNodes.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-foreground tracking-widest uppercase">
          Critical Power Alerts
        </span>
        <Radio className="w-3 h-3 text-destructive ml-auto animate-pulse" />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {currentNode && (
              <div className="glass-card border-t-0 rounded-none px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={prev} className="p-0.5 rounded hover:bg-accent/40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <span className="text-[8px] text-muted-foreground tracking-wider">
                    {currentIndex + 1} / {criticalNodes.length}
                  </span>
                  <button onClick={next} className="p-0.5 rounded hover:bg-accent/40 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentNode.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full mt-0.5 ${currentNode.severity === 'CRITICAL' ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-semibold text-foreground truncate">{currentNode.name}</h4>
                        <p className="text-[9px] text-muted-foreground">{currentNode.city}, {currentNode.state}</p>
                      </div>
                      <span className={`text-[8px] font-bold tracking-wider ${severityColor(currentNode.severity)}`}>
                        {currentNode.severity}
                      </span>
                    </div>

                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-destructive font-medium flex items-center gap-1">
                          <ZapOff className="w-2.5 h-2.5" />
                          {currentNode.status === 'OUTAGE' ? 'No Electricity' : 'Intermittent'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reports</span>
                        <span className="text-foreground">{currentNode.report_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="text-foreground">{getDurationText(currentNode.last_outage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issue</span>
                        <span className="text-destructive font-medium">{getIssueType(currentNode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className={`font-medium ${currentNode.confidence >= 70 ? 'text-foreground' : 'text-warning'}`}>
                          {currentNode.confidence}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-1 mt-2.5">
                  {criticalNodes.slice(0, 8).map((_, i) => (
                    <button key={i} onClick={() => setCurrentIndex(i)} className={`w-1 h-1 rounded-full transition-colors ${i === currentIndex ? 'bg-destructive' : 'bg-border'}`} />
                  ))}
                  {criticalNodes.length > 8 && <span className="text-[7px] text-muted-foreground ml-0.5">+{criticalNodes.length - 8}</span>}
                </div>
              </div>
            )}

            {/* Recent AI signals with expandable details */}
            {recentEvents.length > 0 && (
              <div className="glass-card border-t border-border/30 rounded-b-lg px-3 py-2.5 max-h-[220px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[8px] text-muted-foreground tracking-widest uppercase">Recent AI Signals</p>
                  <button onClick={() => setIsExpanded(false)} className="p-0.5 rounded hover:bg-accent transition-colors">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-1">
                  {recentEvents.slice(0, 8).map((event) => {
                    const isEventExpanded = expandedEventId === event.id;
                    return (
                      <div key={event.id} className="rounded border border-border/20 overflow-hidden">
                        <button
                          onClick={() => setExpandedEventId(isEventExpanded ? null : event.id)}
                          className="w-full flex items-start gap-1.5 px-2 py-1.5 hover:bg-accent/20 transition-colors"
                        >
                          <Zap className={`w-2.5 h-2.5 mt-0.5 shrink-0 ${severityColor(event.severity)}`} />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-1">
                              <p className="text-[9px] text-foreground truncate">
                                {event.node_name || event.city} — {event.state}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[7px] text-muted-foreground">{timeAgo(event.created_at)}</span>
                              {event.signal_count > 1 && (
                                <span className="text-[7px] text-primary">×{event.signal_count} reports</span>
                              )}
                            </div>
                          </div>
                          {isEventExpanded ? (
                            <ChevronUp className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isEventExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2 pb-2 pt-1 space-y-1.5 border-t border-border/20 bg-accent/10">
                                {event.source_snippet && (
                                  <p className="text-[8px] text-foreground/80 leading-relaxed">"{event.source_snippet}"</p>
                                )}
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7px]">
                                  <span className="text-muted-foreground">Severity: <span className={severityColor(event.severity)}>{event.severity}</span></span>
                                  <span className="text-muted-foreground">Confidence: {event.confidence}%</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
