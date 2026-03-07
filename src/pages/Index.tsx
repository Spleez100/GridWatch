import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ElectricityMap from '@/components/ElectricityMap';
import SearchBar from '@/components/SearchBar';
import StatusLegend from '@/components/StatusLegend';
import NodeDetailCard from '@/components/NodeDetailCard';
import { PowerNode } from '@/data/nigeriaNodes';

const Index = () => {
  const [searchCity, setSearchCity] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PowerNode | null>(null);
  const [nodePixel, setNodePixel] = useState<{ x: number; y: number } | null>(null);

  const handleSelectNode = useCallback((node: PowerNode, pixel?: { x: number; y: number }) => {
    setSelectedNode(node);
    setNodePixel(pixel ?? null);
  }, []);

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      {/* Full-screen map */}
      <ElectricityMap
        searchCity={searchCity}
        onClearSearch={() => setSearchCity(null)}
        onSelectNode={handleSelectNode}
        selectedNode={selectedNode}
      />

      {/* Top bar: logo + search */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="flex items-center gap-3 px-4 py-3 pointer-events-auto max-w-md">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight hidden sm:inline">GridWatch</span>
          </div>
          <SearchBar onSearchCity={setSearchCity} onSelectNode={handleSelectNode} />
        </div>
      </div>

      {/* Status legend */}
      <StatusLegend />

      {/* Node detail card anchored near clicked node */}
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
