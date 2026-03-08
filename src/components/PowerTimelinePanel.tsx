import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Zap, ZapOff, AlertTriangle, Radio } from 'lucide-react';
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
  signal_count: number;
  created_at: string;
}

interface Props {
  events: DbGridEvent[];
  onClose: () => void;
}

export default function PowerTimelinePanel({ events }: Props) {
  const [aiEvents, setAiEvents] = useState<AiEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'outages' | 'restored'>('all');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('ai_events')
        .select('id, node_name, city, state, event_type, severity, confidence, source_snippet, signal_count, created_at')
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
    const items: Array<{ id: string; time: string; type: string; location: string; severity?: string; source?: string; isAi: boolean }> = [];
    
    events.forEach((e) => {
      items.push({
        id: e.id,
        time: e.created_at,
        type: e.event_type,
        location: `${e.node_name || 'Unknown'}, ${e.city || ''}`,
        isAi: false,
      });
    });

    aiEvents.forEach((e) => {
      items.push({
        id: e.id,
        time: e.created_at,
        type: e.event_type,
        location: `${e.node_name || e.city || 'Unknown'}, ${e.state || ''}`,
        severity: e.severity,
        source: e.source_snippet || undefined,
        isAi: true,
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
      className="absolute top-16 left-5 z-[1000] w-[300px] max-h-[60vh] glass-card rounded-lg overflow-hidden"
    >
      <div className="px-3 pt-3 pb-2 border-b border-border/30">
        <h3 className="text-[11px] font-semibold text-foreground tracking-widest uppercase mb-2">Power Timeline</h3>
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
          <p className="text-[10px] text-muted-foreground text-center py-4">No events yet</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/50" />
            <div className="space-y-1">
              {combined.slice(0, 30).map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 pl-0.5 py-1.5 relative">
                  <div className="relative z-10 mt-0.5">{eventIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-foreground font-medium truncate">{item.location}</span>
                      {item.isAi && <Radio className="w-2.5 h-2.5 text-primary shrink-0" />}
                    </div>
                    {item.source && (
                      <p className="text-[8px] text-muted-foreground truncate mt-0.5">{item.source}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-muted-foreground">{timeAgo(item.time)}</span>
                      {item.severity && (
                        <span className={`text-[7px] font-bold tracking-wider ${
                          item.severity === 'CRITICAL' ? 'text-destructive' : item.severity === 'HIGH' ? 'text-warning' : 'text-muted-foreground'
                        }`}>{item.severity}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
