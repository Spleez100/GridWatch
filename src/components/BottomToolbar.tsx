import { useMemo, useEffect, useState, useRef } from 'react';
import { Waves, HelpCircle, Maximize2, Info, Lock, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import type { DbGridEvent, DbGridStatus, DbNode } from '@/hooks/useGridData';

type AreaFilter = 'all' | 'lagos' | 'abuja' | 'port-harcourt' | 'kano' | 'enugu';
type TimeRange = '24h' | '12h' | '6h' | '1h';

const areaOptions: { value: AreaFilter; label: string }[] = [
  { value: 'all', label: 'All Areas' },
  { value: 'lagos', label: 'Lagos' },
  { value: 'abuja', label: 'Abuja / FCT' },
  { value: 'port-harcourt', label: 'Port Harcourt' },
  { value: 'kano', label: 'Kano' },
  { value: 'enugu', label: 'Enugu' },
];

const timeOptions: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24 Hour Power Flow' },
  { value: '12h', label: '12 Hour Power Flow' },
  { value: '6h', label: '6 Hour Power Flow' },
  { value: '1h', label: '1 Hour Power Flow' },
];

const timeRangeMs: Record<TimeRange, number> = {
  '24h': 24 * 3600000,
  '12h': 12 * 3600000,
  '6h': 6 * 3600000,
  '1h': 1 * 3600000,
};

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
  nodes?: DbNode[];
}

export default function BottomToolbar({ stats, events, gridStatus, nodes = [] }: Props) {
  const [realtimeEvents, setRealtimeEvents] = useState<DbGridEvent[]>(events);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
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

  // Filter nodes by area
  const filteredNodes = useMemo(() => {
    if (areaFilter === 'all') return nodes;
    const cityMap: Record<string, string[]> = {
      lagos: ['lagos'],
      abuja: ['abuja', 'fct'],
      'port-harcourt': ['port harcourt'],
      kano: ['kano'],
      enugu: ['enugu'],
    };
    const keywords = cityMap[areaFilter] || [];
    return nodes.filter(n =>
      keywords.some(k => n.city.toLowerCase().includes(k) || n.state.toLowerCase().includes(k))
    );
  }, [nodes, areaFilter]);

  // Filtered stats
  const filteredStats = useMemo(() => ({
    total: filteredNodes.length,
    stable: filteredNodes.filter(n => n.status === 'POWER_AVAILABLE').length,
    critical: filteredNodes.filter(n => n.status === 'OUTAGE').length,
    unstable: filteredNodes.filter(n => n.status === 'INTERMITTENT').length,
  }), [filteredNodes]);

  // Filter events by area + time range
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const cutoff = now - timeRangeMs[timeRange];
    return realtimeEvents.filter(e => {
      const t = new Date(e.created_at).getTime();
      if (t < cutoff) return false;
      if (areaFilter === 'all') return true;
      const cityMap: Record<string, string[]> = {
        lagos: ['lagos'],
        abuja: ['abuja', 'fct'],
        'port-harcourt': ['port harcourt'],
        kano: ['kano'],
        enugu: ['enugu'],
      };
      const keywords = cityMap[areaFilter] || [];
      return keywords.some(k => (e.city || '').toLowerCase().includes(k));
    });
  }, [realtimeEvents, areaFilter, timeRange]);

  const barCount = timeRange === '1h' ? 12 : timeRange === '6h' ? 12 : timeRange === '12h' ? 12 : 24;

  const barData = useMemo(() => {
    const bars = Array.from({ length: barCount }, (_, i) => ({ idx: i, outages: 0, restorations: 0, total: 0 }));
    const now = new Date();
    const rangMs = timeRangeMs[timeRange];
    filteredEvents.forEach((e) => {
      const d = new Date(e.created_at);
      const msAgo = now.getTime() - d.getTime();
      if (msAgo < rangMs) {
        const bucket = Math.floor((msAgo / rangMs) * barCount);
        const idx = barCount - 1 - Math.min(bucket, barCount - 1);
        bars[idx].total++;
        if (e.event_type === 'outage_detected') bars[idx].outages++;
        else if (e.event_type === 'power_restored') bars[idx].restorations++;
      }
    });
    return bars.map((h) => ({
      idx: h.idx,
      value: Math.max(10, h.total * 15 + 5),
      isOutage: h.outages > h.restorations,
    }));
  }, [filteredEvents, barCount, timeRange]);

  const timeLabels = useMemo(() => {
    if (timeRange === '1h') return ['60m ago', '40m', '20m', 'Now'];
    if (timeRange === '6h') return ['6h ago', '4h', '2h', 'Now'];
    if (timeRange === '12h') return ['12h ago', '8h', '4h', 'Now'];
    return ['24h ago', '16h', '8h', 'Now'];
  }, [timeRange]);

  const showInstability = gridStatus && gridStatus.status !== 'GRID_STABLE';
  const displayStats = areaFilter === 'all' ? stats : filteredStats;

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
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as AreaFilter)}
              className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground cursor-pointer focus:outline-none"
            >
              {areaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground cursor-pointer focus:outline-none"
            >
              {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
            <p className="text-[10px] text-muted-foreground tracking-wider mb-1.5">
              Electricity Activity — {areaFilter === 'all' ? 'Nationwide' : areaOptions.find(a => a.value === areaFilter)?.label}
            </p>
            <div className="flex items-end gap-[2px] h-8">
              {barData.map((bar, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-[1px] transition-all duration-300 ${bar.isOutage ? 'bg-destructive/70' : 'bg-success/70'}`}
                  style={{ height: `${Math.max(4, bar.value * 0.3)}px` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {timeLabels.map((l, i) => (
                <span key={i} className="text-[8px] text-muted-foreground">{l}</span>
              ))}
            </div>
          </div>

          {showInstability && (
            <div className="flex items-center gap-1.5 bg-accent/50 border border-border/40 rounded px-2.5 py-1.5">
              <span className="text-[10px] text-muted-foreground tracking-wider">Grid Instability Detected</span>
              <AlertTriangle className="w-3 h-3 text-destructive" />
            </div>
          )}

          <div className="flex items-center gap-6 shrink-0">
            <StatBlock label="Fully Powered" value={displayStats.stable} total={displayStats.total} colorClass="bg-success" />
            <StatBlock label="Power Outage" value={displayStats.critical} total={displayStats.total} colorClass="bg-destructive" />
            <StatBlock label="Intermittent" value={displayStats.unstable} total={displayStats.total} colorClass="bg-warning" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
        <span className="text-[9px] text-muted-foreground">/{total}</span>
      </div>
      <p className="text-[9px] text-muted-foreground tracking-wider">{label}</p>
      <div className="flex gap-[1px] mt-1.5">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((value / Math.max(total, 1)) * 30) ? colorClass : 'bg-border/50'}`} />
        ))}
      </div>
    </div>
  );
}
