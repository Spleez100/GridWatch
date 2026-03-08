import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Zap, ZapOff } from 'lucide-react';
import type { DbNode } from '@/hooks/useGridData';

interface Props {
  nodes: DbNode[];
  onFlyTo: (lat: number, lng: number, zoom: number) => void;
  onClose: () => void;
}

interface DiscoGroup {
  disco: string;
  nodes: DbNode[];
  powered: number;
  outage: number;
  intermittent: number;
}

export default function PowerLinesPanel({ nodes, onFlyTo }: Props) {
  const [expandedDisco, setExpandedDisco] = useState<string | null>(null);

  const discos = useMemo(() => {
    const map = new Map<string, DiscoGroup>();
    nodes.forEach((n) => {
      if (!map.has(n.disco)) {
        map.set(n.disco, { disco: n.disco, nodes: [], powered: 0, outage: 0, intermittent: 0 });
      }
      const g = map.get(n.disco)!;
      g.nodes.push(n);
      if (n.status === 'POWER_AVAILABLE') g.powered++;
      else if (n.status === 'OUTAGE') g.outage++;
      else g.intermittent++;
    });
    return Array.from(map.values()).sort((a, b) => b.nodes.length - a.nodes.length);
  }, [nodes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-16 left-5 z-[1000] w-[280px] max-h-[60vh] glass-card rounded-lg overflow-hidden"
    >
      <div className="px-3 pt-3 pb-2 border-b border-border/30">
        <h3 className="text-[11px] font-semibold text-foreground tracking-widest uppercase">Power Lines & DisCos</h3>
        <p className="text-[9px] text-muted-foreground mt-1">Distribution companies and coverage areas</p>
      </div>

      <div className="overflow-y-auto max-h-[50vh] p-2 space-y-1">
        {discos.map((disco) => {
          const healthPct = Math.round((disco.powered / Math.max(disco.nodes.length, 1)) * 100);
          return (
            <div key={disco.disco}>
              <button
                onClick={() => {
                  setExpandedDisco(expandedDisco === disco.disco ? null : disco.disco);
                  const avgLat = disco.nodes.reduce((s, n) => s + n.latitude, 0) / disco.nodes.length;
                  const avgLng = disco.nodes.reduce((s, n) => s + n.longitude, 0) / disco.nodes.length;
                  onFlyTo(avgLat, avgLng, 8);
                }}
                className="w-full px-2.5 py-2 rounded hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[10px] text-foreground font-medium truncate">{disco.disco}</p>
                    <p className="text-[8px] text-muted-foreground">{disco.nodes.length} areas covered</p>
                  </div>
                  <span className={`text-[10px] font-bold ${healthPct >= 70 ? 'text-success' : healthPct >= 40 ? 'text-warning' : 'text-destructive'}`}>
                    {healthPct}%
                  </span>
                </div>
                <div className="flex gap-[1px] mt-1.5">
                  {disco.nodes.map((n) => (
                    <div
                      key={n.id}
                      className={`flex-1 h-1 rounded-[0.5px] ${
                        n.status === 'POWER_AVAILABLE' ? 'bg-success' : n.status === 'OUTAGE' ? 'bg-destructive' : 'bg-warning'
                      }`}
                    />
                  ))}
                </div>
              </button>

              {expandedDisco === disco.disco && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="overflow-hidden pl-8 space-y-0.5 pb-1"
                >
                  <div className="flex gap-3 text-[8px] text-muted-foreground py-1">
                    <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-success" />{disco.powered} powered</span>
                    <span className="flex items-center gap-1"><ZapOff className="w-2.5 h-2.5 text-destructive" />{disco.outage} outage</span>
                  </div>
                  {disco.nodes.slice(0, 15).map((n) => (
                    <div key={n.id} className="flex items-center gap-2 px-2 py-1 text-[9px]">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        n.status === 'POWER_AVAILABLE' ? 'bg-success' : n.status === 'OUTAGE' ? 'bg-destructive' : 'bg-warning'
                      }`} />
                      <span className="text-foreground truncate">{n.name}</span>
                      <span className="text-[8px] text-muted-foreground ml-auto">Band {n.band}</span>
                    </div>
                  ))}
                  {disco.nodes.length > 15 && (
                    <p className="text-[8px] text-muted-foreground pl-2">+{disco.nodes.length - 15} more</p>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
