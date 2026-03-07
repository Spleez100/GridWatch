import { Map, BarChart3, Bell, TrendingUp } from 'lucide-react';

type Tab = 'map' | 'reports' | 'alerts' | 'insights';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
];

export default function NavigationTabs({ active, onChange }: Props) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-[1001] bg-card/95 backdrop-blur-xl border-t border-border/50 md:relative md:border-t-0 md:border-b md:bg-transparent">
      <div className="flex justify-around md:justify-start md:gap-1 md:px-4 md:py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2.5 md:py-1.5 md:rounded-md text-xs md:text-sm transition-colors ${
              active === tab.id
                ? 'text-primary font-medium md:bg-primary/10'
                : 'text-muted-foreground hover:text-foreground md:hover:bg-accent'
            }`}
          >
            <tab.icon className="w-4 h-4 md:w-3.5 md:h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
