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
            className={`block text-[11px] tracking-wider transition-colors ${
              activeView === item
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
