import { useState } from 'react';

const scopeItems = ['SERVICE AREA', 'POWER TIMELINE', 'POWER LINES', 'GRID MAP'];

export default function ScopePanel() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="absolute top-16 left-5 z-[1000] space-y-4">
      <span className="text-xs font-semibold text-foreground tracking-widest">[GRID SCOPE]</span>
      <div className="space-y-1.5">
        {scopeItems.map((item) => (
          <button
            key={item}
            onClick={() => setActive(active === item ? null : item)}
            className={`block text-[11px] tracking-wider transition-colors ${
              active === item
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
