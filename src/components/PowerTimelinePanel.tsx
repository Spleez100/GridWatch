import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Zap, ZapOff, AlertTriangle, Radio, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { DbGridEvent } from '@/hooks/useGridData';

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

interface Props {
  events: DbGridEvent[];
  onClose: () => void;
}

const platformLabels: Record<string, string> = {
  twitter: '𝕏 (Twitter)',
  facebook: 'Facebook',
  reddit: 'Reddit',
  news: 'News',
  forum: 'Forum',
};

export default function PowerTimelinePanel({ events, onClose }: Props) {
  const [aiEvents, setAiEvents] = useState<AiEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'outages' | 'restored'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fetch = async () => {
      const { data } = await supabase
        .from('ai_events')
        .select('id, node_name, city, state, event_type, severity, confidence, source_snippet, source_platform, source_handle, source_url, signal_count, created_at')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setAiEvents(data as AiEvent[]);
    };
    fetch();

    const channel = supabase
      .channel('timeline-ai-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_events' }, (payload) => {
        setAiEvents((prev) => [payload.new as AiEvent, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const combined = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const items: Array<{
      id: string; time: string; type: string; location: string;
      severity?: string; source?: string; isAi: boolean;
      handle?: string; platform?: string; url?: string;
      confidence?: number; signalCount?: number;
    }> = [];

    events.forEach((e) => {
      if (new Date(e.created_at).getTime() < oneDayAgo) return;
      items.push({
        id: e.id, time: e.created_at, type: e.event_type,
        location: `${e.node_name || 'Unknown'}, ${e.city || ''}`, isAi: false,
      });
    });

    aiEvents.forEach((e) => {
      items.push({
        id: e.id, time: e.created_at, type: e.event_type,
        location: `${e.node_name || e.city || 'Unknown'}, ${e.state || ''}`,
        severity: e.severity, source: e.source_snippet || undefined, isAi: true,
        handle: e.source_handle || undefined, platform: e.source_platform || undefined,
        url: e.source_url || undefined, confidence: e.confidence, signalCount: e.signal_count,
      });
    });

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (filter === 'outages') return items.filter((i) => i.type.includes('outage') || i.type.includes('OUTAGE') || i.type.includes('FAILURE'));
    if (filter === 'restored') return items.filter((i) => i.type.includes('restored') || i.type.includes('POWER_AVAILABLE'));
    return items;
  }, [events, aiEvents, filter]);

  const timeAgo = (t: string) => {
    const mins = Math.round((Date.now() - new Date(t).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  const eventIcon = (type: string) => {
    if (type.includes('outage') || type.includes('OUTAGE') || type.includes('FAILURE')) return <ZapOff className="w-3 h-3 text-destructive" />;
    if (type.includes('restored') || type.includes('POWER_AVAILABLE')) return <Zap className="w-3 h-3 text-success" />;
    return <AlertTriangle className="w-3 h-3 text-warning" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-16 left-5 z-[1000] w-[320px] max-h-[60vh] glass-card rounded-lg overflow-hidden"
    >
      <div className="px-3 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-semibold text-foreground tracking-widest uppercase">Power Timeline</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1">
          {(['all', 'outages', 'restored'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] px-2 py-1 rounded tracking-wider transition-colors ${
                filter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {f === 'all' ? 'All Events' : f === 'outages' ? 'Outages' : 'Restored'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[50vh] p-2">
        {combined.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">No recent events (last 24h)</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/50" />
            <div className="space-y-0.5">
              {combined.slice(0, 30).map((item) => {
                const isItemExpanded = expandedId === item.id;
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setExpandedId(isItemExpanded ? null : item.id)}
                      className="w-full flex items-start gap-2.5 pl-0.5 py-1.5 rounded hover:bg-accent/20 transition-colors text-left"
                    >
                      <div className="relative z-10 mt-0.5">{eventIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-foreground font-medium truncate">{item.location}</span>
                          {item.isAi && <Radio className="w-2.5 h-2.5 text-primary shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[8px] text-muted-foreground">{timeAgo(item.time)}</span>
                          {item.handle && (
                            <span className="text-[7px] text-primary">
                              {item.platform === 'twitter' ? `@${item.handle.replace('@', '')}` : item.handle}
                            </span>
                          )}
                          {item.platform && (
                            <span className="text-[7px] text-muted-foreground/60">{platformLabels[item.platform] || item.platform}</span>
                          )}
                          {item.severity && (
                            <span className={`text-[7px] font-bold tracking-wider ${
                              item.severity === 'CRITICAL' ? 'text-destructive' : item.severity === 'HIGH' ? 'text-warning' : 'text-muted-foreground'
                            }`}>{item.severity}</span>
                          )}
                        </div>
                      </div>
                      {item.isAi && (
                        isItemExpanded
                          ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-1" />
                          : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isItemExpanded && item.isAi && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 px-2 pb-2 pt-1 rounded bg-accent/10 border border-border/20 space-y-1.5">
                            {item.source && (
                              <p className="text-[8px] text-foreground/80 leading-relaxed">"{item.source}"</p>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7px]">
                              {item.confidence && <span className="text-muted-foreground">Confidence: {item.confidence}%</span>}
                              {item.signalCount && item.signalCount > 1 && <span className="text-primary">×{item.signalCount} confirmations</span>}
                            </div>
                            {item.handle && (
                              <p className="text-[8px] text-primary">
                                Posted by: {item.platform === 'twitter' ? `@${item.handle.replace('@', '')}` : item.handle}
                                {item.platform && ` on ${platformLabels[item.platform] || item.platform}`}
                              </p>
                            )}
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
      </div>
    </motion.div>
  );
}
