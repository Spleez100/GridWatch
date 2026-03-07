import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import ElectricityMap from '@/components/ElectricityMap';
import SearchBar from '@/components/SearchBar';
import ScopePanel from '@/components/ScopePanel';
import StatsPanel from '@/components/StatsPanel';
import BottomToolbar from '@/components/BottomToolbar';
import NodeDetailCard from '@/components/NodeDetailCard';
import { PowerNode, powerNodes } from '@/data/nigeriaNodes';
import { TrendingUp } from 'lucide-react';

const Index = () => {
  const [searchCity, setSearchCity] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PowerNode | null>(null);
  const [nodePixel, setNodePixel] = useState<{ x: number; y: number } | null>(null);

  const handleSelectNode = useCallback((node: PowerNode, pixel?: { x: number; y: number }) => {
    setSelectedNode(node);
    setNodePixel(pixel ?? null);
  }, []);

  const stats = useMemo(() => ({
    total: powerNodes.length,
    stable: powerNodes.filter(n => n.status === 'green').length,
    critical: powerNodes.filter(n => n.status === 'red').length,
    unstable: powerNodes.filter(n => n.status === 'yellow').length,
    maintenance: powerNodes.filter(n => n.status === 'blue').length,
  }), []);

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      {/* Full-screen map */}
      <ElectricityMap
        searchCity={searchCity}
        onClearSearch={() => setSearchCity(null)}
        onSelectNode={handleSelectNode}
        selectedNode={selectedNode}
      />

      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Grid axis labels */}
      {['A', 'B', 'C', 'D', 'E'].map((label, i) => (
        <span
          key={`col-${label}`}
          className="grid-axis-label"
          style={{ top: 8, left: `${(i + 1) * 120}px` }}
        >
          {label}
        </span>
      ))}
      {[1, 2, 3, 4].map((label, i) => (
        <span
          key={`row-${label}`}
          className="grid-axis-label"
          style={{ top: `${(i + 1) * 120}px`, left: 8 }}
        >
          {label}.
        </span>
      ))}

      {/* Top-left logo */}
      <div className="absolute top-4 left-5 z-[1000]">
        <div className="w-9 h-9 rounded-md bg-card/80 backdrop-blur border border-border/40 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-foreground" />
        </div>
      </div>

      {/* Top-right search */}
      <div className="absolute top-4 right-5 z-[1000]">
        <SearchBar onSearchCity={setSearchCity} onSelectNode={handleSelectNode} />
      </div>

      {/* Left scope panel */}
      <ScopePanel />

      {/* Right stats panel */}
      <StatsPanel stats={stats} />

      {/* Bottom toolbar */}
      <BottomToolbar stats={stats} />

      {/* Node detail card */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailCard
            node={selectedNode}
            pixel={nodePixel}
            onClose={() => { setSelectedNode(null); setNodePixel(null); }}
            onReport={(node, reportType) => {
              console.log(`Report: ${reportType} at ${node.name}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
