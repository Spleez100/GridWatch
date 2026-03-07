import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { powerNodes, cityCoords } from '@/data/nigeriaNodes';

interface Props {
  onSearchCity: (city: string) => void;
  onSelectNode: (node: typeof powerNodes[0]) => void;
}

export default function SearchBar({ onSearchCity, onSelectNode }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="absolute top-4 left-4 z-[1000] w-[320px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search city, area, or street..."
          className="w-full pl-10 pr-4 py-2.5 bg-card/90 backdrop-blur-xl border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      {focused && results.length > 0 && (
        <div className="mt-1.5 glass-card rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors text-sm flex items-center gap-2"
              onMouseDown={() => {
                if (r.type === 'city') onSearchCity(r.city);
                else if (r.node) onSelectNode(r.node);
                setQuery('');
              }}
            >
              <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'city' ? 'bg-info/20 text-info' : 'bg-accent text-muted-foreground'}`}>
                {r.type === 'city' ? 'City' : 'Area'}
              </span>
              <span className="text-foreground">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
