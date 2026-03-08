import { useState } from 'react';

export type ScopeView = 'GRID MAP' | 'POWER TIMELINE' | 'SERVICE AREA' | 'POWER LINES' | null;

const scopeItems: ScopeView[] = ['GRID MAP', 'POWER TIMELINE', 'SERVICE AREA', 'POWER LINES'];

interface Props {
  activeView: ScopeView;
  onViewChange: (view: ScopeView) => void;
}

export default function ScopePanel({ activeView, onViewChange }: Props) {
  return (
    <div className="absolute top-16 left-5 z-[900] space-y-4">
      <span className="text-xs font-semibold text-foreground tracking-widest">[GRID SCOPE]</span>
      <div className="space-y-1.5">
        {scopeItems.map((item) => (
          <button
            key={item}
            onClick={() => onViewChange(activeView === item ? 'GRID MAP' : item)}
            className={`block text-[11px] tracking-wider px-2.5 py-1 rounded transition-all ${
              activeView === item
                ? 'glass-tab-active text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground/70 hover:glass-tab'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
