import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  stats: {
    total: number;
    stable: number;
    critical: number;
    unstable: number;
    maintenance: number;
  };
}

const gridStates = ['Stable', 'Fluctuating', 'Partial Outage', 'Grid Collapse'] as const;

export default function StatsPanel({ stats }: Props) {
  const poweredPercent = useMemo(() => {
    return Math.round((stats.stable / stats.total) * 100);
  }, [stats]);

  // Determine national grid status
  const gridStatus = useMemo(() => {
    const outageRatio = (stats.critical + stats.unstable) / stats.total;
    if (outageRatio > 0.6) return 'Grid Collapse';
    if (outageRatio > 0.4) return 'Partial Outage';
    if (outageRatio > 0.2) return 'Fluctuating';
    return 'Stable';
  }, [stats]);

  const gridStatusColor = {
    'Stable': 'text-success',
    'Fluctuating': 'text-warning',
    'Partial Outage': 'text-destructive',
    'Grid Collapse': 'text-destructive',
  }[gridStatus];

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (poweredPercent / 100) * circumference;

  return (
    <div className="absolute top-1/4 right-5 z-[1000] space-y-4 w-[180px]">
      {/* Active Power Zones card */}
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
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              className="transition-all duration-700"
            />
          </svg>
        </div>
        <button className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-wider border border-border/50 rounded px-2.5 py-1.5">
          View Details <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* National Grid Status */}
      <div className="glass-card rounded-lg p-4">
        <p className="text-[10px] text-muted-foreground tracking-wider mb-2">National Grid Status</p>
        <p className={`text-sm font-semibold ${gridStatusColor}`}>{gridStatus}</p>
        <div className="mt-3 space-y-1">
          {gridStates.map((state) => (
            <div key={state} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                state === gridStatus ? 'bg-foreground' : 'bg-border'
              }`} />
              <span className={`text-[9px] tracking-wider ${
                state === gridStatus ? 'text-foreground' : 'text-muted-foreground'
              }`}>{state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
