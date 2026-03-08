import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, ZapOff, AlertTriangle, ChevronRight } from 'lucide-react';
import type { DbNode } from '@/hooks/useGridData';

interface Props {
  nodes: DbNode[];
  onSelectNode: (node: DbNode) => void;
  onFlyTo: (lat: number, lng: number, zoom: number) => void;
  onClose: () => void;
}

interface AreaGroup {
  city: string;
  state: string;
  nodes: DbNode[];
  powered: number;
  outage: number;
  intermittent: number;
}

export default function ServiceAreasPanel({ nodes, onSelectNode, onFlyTo, onClose }: Props) {
  const [filter, setFilter] = useState<'all' | 'outage' | 'powered' | 'intermittent'>('all');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const areas = useMemo(() => {
    const map = new Map<string, AreaGroup>();
    nodes.forEach((n) => {
      const key = `${n.city}-${n.state}`;
      if (!map.has(key)) {
        map.set(key, { city: n.city, state: n.state, nodes: [], powered: 0, outage: 0, intermittent: 0 });
      }
      const g = map.get(key)!;
      g.nodes.push(n);
      if (n.status === 'POWER_AVAILABLE') g.powered++;
      else if (n.status === 'OUTAGE') g.outage++;
      else g.intermittent++;
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.outage - a.outage || b.nodes.length - a.nodes.length);
    return arr;
  }, [nodes]);

  const filtered = useMemo(() => {
    if (filter === 'all') return areas;
    if (filter === 'outage') return areas.filter((a) => a.outage > 0);
    if (filter === 'powered') return areas.filter((a) => a.powered > 0);
    return areas.filter((a) => a.intermittent > 0);
  }, [areas, filter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-16 left-5 z-[1000] w-[280px] max-h-[60vh] glass-card rounded-lg overflow-hidden"
    >
      <div className="px-3 pt-3 pb-2 border-b border-border/30">
        <h3 className="text-[11px] font-semibold text-foreground tracking-widest uppercase mb-2">Service Areas</h3>
        <div className="flex gap-1">
          {(['all', 'outage', 'powered', 'intermittent'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] px-2 py-1 rounded tracking-wider transition-colors ${
                filter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'outage' ? 'Outage' : f === 'powered' ? 'Powered' : 'Unstable'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[50vh] p-2 space-y-1">
        {filtered.map((area) => (
          <div key={`${area.city}-${area.state}`}>
            <button
              onClick={() => {
                const avgLat = area.nodes.reduce((s, n) => s + n.latitude, 0) / area.nodes.length;
                const avgLng = area.nodes.reduce((s, n) => s + n.longitude, 0) / area.nodes.length;
                onFlyTo(avgLat, avgLng, 12);
                setExpandedCity(expandedCity === area.city ? null : area.city);
              }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-accent/40 transition-colors group"
            >
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] text-foreground font-medium truncate">{area.city}</p>
                <p className="text-[8px] text-muted-foreground">{area.state} • {area.nodes.length} areas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {area.powered > 0 && <span className="text-[8px] text-success">{area.powered}⚡</span>}
                {area.outage > 0 && <span className="text-[8px] text-destructive">{area.outage}✕</span>}
                {area.intermittent > 0 && <span className="text-[8px] text-warning">{area.intermittent}~</span>}
              </div>
              <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${expandedCity === area.city ? 'rotate-90' : ''}`} />
            </button>

            {expandedCity === area.city && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="overflow-hidden pl-6 space-y-0.5"
              >
                {area.nodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/30 transition-colors"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      node.status === 'POWER_AVAILABLE' ? 'bg-success' : node.status === 'OUTAGE' ? 'bg-destructive' : 'bg-warning'
                    }`} />
                    <span className="text-[9px] text-foreground truncate">{node.name}</span>
                    <span className="text-[8px] text-muted-foreground ml-auto">{node.confidence}%</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
