export type ScopeView = 'GRID MAP' | 'POWER TIMELINE' | 'SERVICE AREA' | 'POWER LINES' | null;

const scopeItems: { key: ScopeView; label: string }[] = [
  { key: 'GRID MAP', label: 'Map' },
  { key: 'POWER TIMELINE', label: 'Timeline' },
  { key: 'SERVICE AREA', label: 'Areas' },
  { key: 'POWER LINES', label: 'Power Lines' },
];

interface Props {
  activeView: ScopeView;
  onViewChange: (view: ScopeView) => void;
}

export default function ScopePanel({ activeView, onViewChange }: Props) {
  return (
    <div className="absolute top-16 left-5 z-[900] space-y-3">
      <span className="text-[11px] font-semibold text-foreground tracking-wider">View</span>
      <div className="space-y-1">
        {scopeItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onViewChange(activeView === item.key ? 'GRID MAP' : item.key)}
            className={`block text-[11px] tracking-wider transition-colors ${
              activeView === item.key
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
