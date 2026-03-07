import { useMemo } from 'react';
import { Waves, HelpCircle, Maximize2, Info, Lock, AlertTriangle } from 'lucide-react';
import { powerNodes } from '@/data/nigeriaNodes';

interface Props {
  stats: {
    total: number;
    stable: number;
    critical: number;
    unstable: number;
    maintenance: number;
  };
}

export default function BottomToolbar({ stats }: Props) {
  // Generate fake hourly bar data
  const barData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      value: Math.random() * 100,
      isOutage: Math.random() > 0.7,
    }));
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
      <div className="pointer-events-auto">
        {/* Icon toolbar */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {[Waves, HelpCircle, Maximize2, Info, Lock].map((Icon, i) => (
            <button
              key={i}
              className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Main bottom bar */}
        <div className="bg-card/90 backdrop-blur-xl border-t border-border/40 px-5 py-3 flex items-end justify-between gap-6">
          {/* Left: filters + status dots */}
          <div className="flex items-center gap-3 shrink-0">
            <select className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground appearance-none cursor-pointer focus:outline-none">
              <option>Power grid</option>
              <option>Region view</option>
            </select>
            <select className="bg-accent/50 border border-border/40 rounded px-2.5 py-1 text-[10px] text-muted-foreground appearance-none cursor-pointer focus:outline-none">
              <option>12hr activity</option>
              <option>24hr activity</option>
            </select>

            {/* Status dots row */}
            <div className="flex items-center gap-2 ml-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <div className="w-2 h-2 rounded-full bg-success" />
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
          </div>

          {/* Center: bar chart + activity label */}
          <div className="flex-1 max-w-md">
            <p className="text-[10px] text-muted-foreground tracking-wider mb-1.5">Surface Activity Breakdown</p>
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

          {/* Unstable badge */}
          <div className="flex items-center gap-1.5 bg-accent/50 border border-border/40 rounded px-2.5 py-1.5">
            <span className="text-[10px] text-muted-foreground tracking-wider">Unstable connection</span>
            <AlertTriangle className="w-3 h-3 text-destructive" />
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-6 shrink-0">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{stats.stable.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-wider">Stable Zones</p>
              {/* progress bar */}
              <div className="flex gap-[1px] mt-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((stats.stable / stats.total) * 30) ? 'bg-success' : 'bg-border/50'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">{stats.critical.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground">/{stats.total}</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-wider">Critical Zones</p>
              <div className="flex gap-[1px] mt-1.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-[3px] h-2 rounded-[0.5px] ${i < Math.round((stats.critical / stats.total) * 30) ? 'bg-destructive' : 'bg-border/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
