import { useMemo, useEffect, useState, useRef } from 'react';
import { Waves, HelpCircle, Maximize2, Info, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DbGridEvent, DbGridStatus } from '@/hooks/useGridData';

interface Props {
  stats: {
    total: number;
    stable: number;
    critical: number;
    unstable: number;
    maintenance: number;
  };
  events: DbGridEvent[];
  gridStatus: DbGridStatus | null;
}

export default function BottomToolbar({ stats, events, gridStatus }: Props) {
  const [realtimeEvents, setRealtimeEvents] = useState<DbGridEvent[]>(events);
  const tickRef = useRef(0);
  const [, setTick] = useState(0);

  // Sync prop events
  useEffect(() => { setRealtimeEvents(events); }, [events]);

  // Subscribe to new grid_events in real-time
  useEffect(() => {
    const channel = supabase
      .channel('bottom-toolbar-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grid_events' }, (payload) => {
        setRealtimeEvents((prev) => [payload.new as DbGridEvent, ...prev].slice(0, 100));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Tick every 30s to keep "time ago" labels fresh
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      setTick(tickRef.current);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const barData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, outages: 0, restorations: 0, total: 0 }));
    const now = new Date();
    realtimeEvents.forEach((e) => {
      const d = new Date(e.created_at);
      const hoursAgo = (now.getTime() - d.getTime()) / 3600000;
      if (hoursAgo < 24) {
        const h = d.getHours();
        hours[h].total++;
        if (e.event_type === 'outage_detected') hours[h].outages++;
        else if (e.event_type === 'power_restored') hours[h].restorations++;
      }
    });
    return hours.map((h) => ({
      hour: h.hour,
      value: Math.max(10, h.total * 15 + 5),
      isOutage: h.outages > h.restorations,
    }));
  }, [realtimeEvents]);

  const showInstability = gridStatus && gridStatus.status !== 'GRID_STABLE';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
      <div className="pointer-events-auto">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[Waves, HelpCircle, Maximize2, Info, Lock].map((Icon, i) => (
            <button key={i} className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="bg-card/90 backdrop-blur-xl border-t border-border/40 px-5 py-3 flex items-end justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <select className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground appearance-none cursor-pointer focus:outline-none">
              <option>Area Overview</option>
            </select>
            <select className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground appearance-none cursor-pointer focus:outline-none">
              <option>24 Hour Power Flow</option>
            </select>

            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[8px] text-muted-foreground tracking-wider">Power Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-[8px] text-muted-foreground tracking-wider">Intermittent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-[8px] text-muted-foreground tracking-wider">Outage</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <p className="text-[10px] text-muted-foreground tracking-wider mb-1.5">Electricity Activity Timeline</p>
            <div className="flex items-end gap-[2px] h-8">
              {barData.map((bar, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-[1px] ${bar.isOutage ? 'bg-destructive/70' : 'bg-success/70'}`}
                  style={{ height: `${Math.max(4, bar.value * 0.3)}px` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-muted-foreground">12 AM</span>
              <span className="text-[8px] text-muted-foreground">8 AM</span>
              <span className="text-[8px] text-muted-foreground">6 PM</span>
              <span className="text-[8px] text-muted-foreground">12 AM</span>
            </div>
          </div>

          {showInstability && (
            <div className="flex items-center gap-1.5 bg-accent/50 border border-border/40 rounded px-2.5 py-1.5">
              <span className="text-[10px] text-muted-foreground tracking-wider">Grid Instability Detected</span>
              <AlertTriangle className="w-3 h-3 text-destructive" />
            </div>
          )}

          <div className="flex items-center gap-6 shrink-0">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{stats.stable.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-wider">Fully Powered Areas</p>
              <div className="flex gap-[1px] mt-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((stats.stable / Math.max(stats.total, 1)) * 30) ? 'bg-success' : 'bg-border/50'}`} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{stats.critical.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-wider">Power Outage Areas</p>
              <div className="flex gap-[1px] mt-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((stats.critical / Math.max(stats.total, 1)) * 30) ? 'bg-destructive' : 'bg-border/50'}`} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{stats.unstable.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-wider">Intermittent Supply</p>
              <div className="flex gap-[1px] mt-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((stats.unstable / Math.max(stats.total, 1)) * 30) ? 'bg-warning' : 'bg-border/50'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
