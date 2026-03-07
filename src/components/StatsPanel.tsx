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

export default function StatsPanel({ stats }: Props) {
  const activityPercent = useMemo(() => {
    return Math.round(((stats.critical + stats.unstable) / stats.total) * 100);
  }, [stats]);

  // SVG circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activityPercent / 100) * circumference;

  return (
    <div className="absolute top-1/4 right-5 z-[1000] space-y-4 w-[180px]">
      {/* Activity card */}
      <div className="glass-card rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{stats.total}</span>
              <span className="text-[10px] text-muted-foreground">/{stats.critical + stats.unstable}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">Grid Activity</p>
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
          View <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Globe / mini map placeholder */}
      <div className="glass-card rounded-lg p-4 aspect-square flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
          {/* Wireframe globe */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
          <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
          <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(var(--foreground))" strokeWidth="0.3" />
          {[25, 35, 65, 75].map(y => (
            <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="hsl(var(--foreground))" strokeWidth="0.2" />
          ))}
          {/* Nigeria dot */}
          <circle cx="48" cy="52" r="2" fill="hsl(var(--primary))" />
        </svg>
      </div>
    </div>
  );
}
