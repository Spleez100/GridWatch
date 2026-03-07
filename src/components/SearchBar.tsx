import { useState } from 'react';
import { Search } from 'lucide-react';
import { powerNodes, cityCoords, PowerNode } from '@/data/nigeriaNodes';

interface Props {
  onSearchCity: (city: string) => void;
  onSelectNode: (node: PowerNode) => void;
}

export default function SearchBar({ onSearchCity, onSelectNode }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = query.length > 1
    ? [
        ...Object.keys(cityCoords)
          .filter(c => c.toLowerCase().includes(query.toLowerCase()))
          .map(c => ({ type: 'city' as const, label: c, city: c })),
        ...powerNodes
          .filter(n => n.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6)
          .map(n => ({ type: 'node' as const, label: `${n.name}, ${n.city}`, node: n })),
      ]
    : [];

  return (
    <div className="relative w-[200px]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="search"
          className="w-full pl-8 pr-3 py-2 bg-card/80 backdrop-blur border border-border/40 rounded text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 tracking-wider"
        />
      </div>
      {focused && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 glass-card rounded overflow-hidden max-h-[250px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-[11px] flex items-center gap-2"
              onMouseDown={() => {
                if (r.type === 'city') onSearchCity(r.city);
                else if (r.node) onSelectNode(r.node);
                setQuery('');
              }}
            >
              <span className={`text-[9px] px-1 py-0.5 rounded tracking-wider ${r.type === 'city' ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}>
                {r.type === 'city' ? 'CITY' : 'AREA'}
              </span>
              <span className="text-foreground">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
