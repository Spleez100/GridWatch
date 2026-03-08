import { useMemo, useEffect, useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DbGridEvent, DbGridStatus, DbNode } from '@/hooks/useGridData';

interface Props {
  stats: { total: number; stable: number; critical: number; unstable: number; maintenance: number };
  events: DbGridEvent[];
  gridStatus: DbGridStatus | null;
  nodes?: DbNode[];
}

export default function BottomToolbar({ stats, events, gridStatus, nodes = [] }: Props) {
  const [realtimeEvents, setRealtimeEvents] = useState<DbGridEvent[]>(events);
  const tickRef = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => { setRealtimeEvents(events); }, [events]);

  useEffect(() => {
    const channel = supabase
      .channel('bottom-toolbar-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grid_events' }, (payload) => {
        setRealtimeEvents((prev) => [payload.new as DbGridEvent, ...prev].slice(0, 200));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { tickRef.current++; setTick(tickRef.current); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Last 24h activity bars
  const barData = useMemo(() => {
    const bars = Array.from({ length: 24 }, (_, i) => ({ idx: i, outages: 0, restorations: 0 }));
    const now = Date.now();
    realtimeEvents.forEach((e) => {
      const msAgo = now - new Date(e.created_at).getTime();
      if (msAgo < 24 * 3600000) {
        const bucket = Math.floor((msAgo / (24 * 3600000)) * 24);
        const idx = 23 - Math.min(bucket, 23);
        if (e.event_type === 'outage_detected') bars[idx].outages++;
        else if (e.event_type === 'power_restored') bars[idx].restorations++;
      }
    });
    return bars.map((h) => ({
      value: Math.max(4, (h.outages + h.restorations) * 12 + 4),
      isOutage: h.outages > h.restorations,
    }));
  }, [realtimeEvents]);

  const showInstability = gridStatus && gridStatus.status !== 'GRID_STABLE';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      <div className="bg-card/90 backdrop-blur-xl border-t border-border/40 px-5 py-3 flex items-end justify-between gap-6">
        {/* Legend */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-[10px] text-muted-foreground">Light on</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground">Unstable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <span className="text-[10px] text-muted-foreground">No light</span>
          </div>
        </div>

        {/* Activity chart */}
        <div className="flex-1 max-w-sm">
          <p className="text-[10px] text-muted-foreground mb-1.5">Activity — Last 24 hours</p>
          <div className="flex items-end gap-[2px] h-7">
            {barData.map((bar, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-[1px] transition-all duration-300 ${bar.isOutage ? 'bg-destructive/70' : 'bg-success/70'}`}
                style={{ height: `${Math.max(3, bar.value * 0.3)}px` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted-foreground">24h ago</span>
            <span className="text-[8px] text-muted-foreground">Now</span>
          </div>
        </div>

        {showInstability && (
          <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[11px] text-destructive font-medium">Grid unstable</span>
          </div>
        )}

        {/* Simple stats */}
        <div className="flex items-center gap-5 shrink-0">
          <QuickStat label="Light on" value={stats.stable} total={stats.total} colorClass="bg-success" />
          <QuickStat label="No light" value={stats.critical} total={stats.total} colorClass="bg-destructive" />
          <QuickStat label="Unstable" value={stats.unstable} total={stats.total} colorClass="bg-warning" />
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
        <span className="text-[9px] text-muted-foreground">/{total}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="flex gap-[1px] mt-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`w-[3px] h-1.5 rounded-[0.5px] ${i < Math.round((value / Math.max(total, 1)) * 20) ? colorClass : 'bg-border/50'}`} />
        ))}
      </div>
    </div>
  );
}
