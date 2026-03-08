import { useMemo } from 'react';
import type { DbGridStatus, DbNode } from '@/hooks/useGridData';

interface Props {
  stats: { total: number; stable: number; critical: number; unstable: number; maintenance: number };
  gridStatus: DbGridStatus | null;
  nodes?: DbNode[];
}

const gridStatusLabels: Record<string, { label: string; colorClass: string }> = {
  GRID_STABLE: { label: 'Grid Stable', colorClass: 'text-success' },
  GRID_FLUCTUATING: { label: 'Grid Unstable', colorClass: 'text-warning' },
  PARTIAL_OUTAGE: { label: 'Partial Blackout', colorClass: 'text-destructive' },
  GRID_COLLAPSE: { label: 'Grid Collapsed', colorClass: 'text-destructive' },
};

export default function StatsPanel({ stats, gridStatus }: Props) {
  const poweredPercent = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.stable / stats.total) * 100) : 0;
  }, [stats]);

  const statusInfo = gridStatus ? (gridStatusLabels[gridStatus.status] || gridStatusLabels.GRID_STABLE) : gridStatusLabels.GRID_STABLE;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (poweredPercent / 100) * circumference;

  return (
    <div className="absolute top-1/4 right-5 z-[1000] space-y-3 w-[170px]">
      {/* Power summary */}
      <div className="glass-card rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{stats.stable}</span>
              <span className="text-[10px] text-muted-foreground">/{stats.total}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Areas with light</p>
          </div>
          <svg width="64" height="64" viewBox="0 0 64 64" className="-mt-1">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              transform="rotate(-90 32 32)" className="transition-all duration-700" />
          </svg>
        </div>
      </div>

      {/* Grid status */}
      <div className="glass-card rounded-lg p-4">
        <p className="text-[10px] text-muted-foreground mb-1.5">National Grid</p>
        <p className={`text-sm font-bold ${statusInfo.colorClass}`}>{statusInfo.label}</p>
      </div>

      {/* Quick stats */}
      <div className="glass-card rounded-lg p-3 space-y-2">
        <StatRow label="No light" value={stats.critical} dotClass="bg-destructive" />
        <StatRow label="Unstable" value={stats.unstable} dotClass="bg-warning" />
      </div>
    </div>
  );
}

function StatRow({ label, value, dotClass }: { label: string; value: number; dotClass: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
