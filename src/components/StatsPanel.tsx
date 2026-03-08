import { useMemo, useState } from 'react';
import { ArrowRight, X, Zap, AlertTriangle, Radio, MapPin, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DbGridStatus, DbNode } from '@/hooks/useGridData';

interface Props {
  stats: {
    total: number;
    stable: number;
    critical: number;
    unstable: number;
    maintenance: number;
  };
  gridStatus: DbGridStatus | null;
  nodes?: DbNode[];
}

const gridStates = ['Stable', 'Fluctuating', 'Partial Outage', 'Grid Collapse'] as const;

const gridStatusMap: Record<string, string> = {
  GRID_STABLE: 'Stable',
  GRID_FLUCTUATING: 'Fluctuating',
  PARTIAL_OUTAGE: 'Partial Outage',
  GRID_COLLAPSE: 'Grid Collapse',
};

export default function StatsPanel({ stats, gridStatus, nodes = [] }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const poweredPercent = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0;
  }, [stats]);

  const currentGridStatus = gridStatus ? (gridStatusMap[gridStatus.status] || 'Stable') : 'Stable';

  const gridStatusColor = {
    'Stable': 'text-success',
    'Fluctuating': 'text-warning',
    'Partial Outage': 'text-destructive',
    'Grid Collapse': 'text-destructive',
  }[currentGridStatus] || 'text-success';

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (poweredPercent / 100) * circumference;

  // Breakdown by state (top 10)
  const stateBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; powered: number; outage: number; intermittent: number }>();
    nodes.forEach(n => {
      const s = map.get(n.state) || { total: 0, powered: 0, outage: 0, intermittent: 0 };
      s.total++;
      if (n.status === 'POWER_AVAILABLE') s.powered++;
      else if (n.status === 'OUTAGE') s.outage++;
      else s.intermittent++;
      map.set(n.state, s);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);
  }, [nodes]);

  // Breakdown by DisCo
  const discoBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; powered: number; outage: number }>();
    nodes.forEach(n => {
      const s = map.get(n.disco) || { total: 0, powered: 0, outage: 0 };
      s.total++;
      if (n.status === 'POWER_AVAILABLE') s.powered++;
      else if (n.status === 'OUTAGE') s.outage++;
      map.set(n.disco, s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [nodes]);

  // Band distribution
  const bandDistribution = useMemo(() => {
    const map: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    nodes.forEach(n => { if (map[n.band] !== undefined) map[n.band]++; });
    return Object.entries(map);
  }, [nodes]);

  return (
    <>
      <div className="absolute top-1/4 right-5 z-[1000] space-y-4 w-[180px]">
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{stats.stable}</span>
                <span className="text-[10px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">Areas Powered</p>
            </div>
            <svg width="64" height="64" viewBox="0 0 64 64" className="-mt-1">
              <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                transform="rotate(-90 32 32)" className="transition-all duration-700" />
            </svg>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-wider border border-border/50 rounded px-2.5 py-1.5"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="glass-card rounded-lg p-4">
          <p className="text-[10px] text-muted-foreground tracking-wider mb-2">National Grid Status</p>
          <p className={`text-sm font-semibold ${gridStatusColor}`}>{currentGridStatus}</p>
          <div className="mt-3 space-y-1">
            {gridStates.map((state) => (
              <div key={state} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${state === currentGridStatus ? 'bg-foreground' : 'bg-border'}`} />
                <span className={`text-[9px] tracking-wider ${state === currentGridStatus ? 'text-foreground' : 'text-muted-foreground'}`}>{state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details overlay */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-5 z-[1100] w-[320px] max-h-[calc(100vh-140px)] overflow-y-auto glass-card rounded-lg shadow-2xl shadow-black/50"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground tracking-wider">Grid Details</h3>
              <button onClick={() => setShowDetails(false)} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Summary */}
              <div className="space-y-2">
                <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Overview</p>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat icon={Zap} label="Powered" value={stats.stable} color="text-success" />
                  <MiniStat icon={AlertTriangle} label="Outage" value={stats.critical} color="text-destructive" />
                  <MiniStat icon={Radio} label="Unstable" value={stats.unstable} color="text-warning" />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {poweredPercent}% of {stats.total} monitored areas currently have power.
                </div>
              </div>

              {/* Band Distribution */}
              <div className="space-y-2">
                <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Band Distribution</p>
                {bandDistribution.map(([band, count]) => (
                  <div key={band} className="flex items-center justify-between">
                    <span className="text-[10px] text-foreground font-medium">Band {band}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-border/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top States */}
              <div className="space-y-2">
                <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Top States</p>
                {stateBreakdown.map(([state, data]) => (
                  <div key={state} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-foreground">{state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-success">{data.powered}</span>
                      <span className="text-[9px] text-muted-foreground">/</span>
                      <span className="text-[9px] text-destructive">{data.outage}</span>
                      <span className="text-[9px] text-muted-foreground">/</span>
                      <span className="text-[9px] text-warning">{data.intermittent}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DisCo Performance */}
              <div className="space-y-2">
                <p className="text-[9px] text-muted-foreground tracking-widest uppercase">DisCo Performance</p>
                {discoBreakdown.map(([disco, data]) => {
                  const pct = data.total > 0 ? Math.round((data.powered / data.total) * 100) : 0;
                  return (
                    <div key={disco}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-foreground">{disco}</span>
                        <span className={`text-[9px] font-medium ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive'}`}>{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cancel */}
              <button
                onClick={() => setShowDetails(false)}
                className="w-full text-[10px] tracking-wider text-muted-foreground hover:text-foreground py-2 rounded border border-border/30 hover:bg-accent/30 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-accent/30 rounded p-2 text-center">
      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${color}`} />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[8px] text-muted-foreground tracking-wider">{label}</p>
    </div>
  );
}
