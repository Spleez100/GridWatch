import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ElectricityMap from '@/components/ElectricityMap';
import SearchBar from '@/components/SearchBar';
import ScopePanel, { ScopeView } from '@/components/ScopePanel';
import StatsPanel from '@/components/StatsPanel';
import BottomToolbar from '@/components/BottomToolbar';
import NodeDetailCard from '@/components/NodeDetailCard';
import CriticalAlertsCarousel from '@/components/CriticalAlertsCarousel';
import ServiceAreasPanel from '@/components/ServiceAreasPanel';
import PowerTimelinePanel from '@/components/PowerTimelinePanel';
import PowerLinesPanel from '@/components/PowerLinesPanel';
import { useNodes, useGridStatus, useGridEvents, useReportPower, DbNode } from '@/hooks/useGridData';
import { TrendingUp } from 'lucide-react';

const Index = () => {
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<DbNode | null>(null);
  const [nodePixel, setNodePixel] = useState<{ x: number; y: number } | null>(null);
  const [activeView, setActiveView] = useState<ScopeView>('GRID MAP');

  const { nodes, loading } = useNodes();
  const gridStatus = useGridStatus();
  const gridEvents = useGridEvents();
  const { report, submitting } = useReportPower();

  const handleSelectNode = useCallback((node: DbNode, pixel?: { x: number; y: number }) => {
    setSelectedNode(node);
    setNodePixel(pixel ?? null);
  }, []);

  const handleSearchCity = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 12 });
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number, zoom: number) => {
    setFlyTo({ lat, lng, zoom });
  }, []);

  const handleReport = useCallback(async (node: DbNode, type: string) => {
    const reportTypeMap: Record<string, string> = {
      'Power Available': 'POWER_AVAILABLE',
      'No Power': 'OUTAGE',
      'Intermittent Supply': 'INTERMITTENT',
    };
    await report(node.id, reportTypeMap[type] || type);
  }, [report]);

  const stats = {
    total: nodes.length,
    stable: nodes.filter(n => n.status === 'POWER_AVAILABLE').length,
    critical: nodes.filter(n => n.status === 'OUTAGE').length,
    unstable: nodes.filter(n => n.status === 'INTERMITTENT').length,
    maintenance: 0,
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      <ElectricityMap
        nodes={nodes}
        flyTo={flyTo}
        onClearFlyTo={() => setFlyTo(null)}
        onSelectNode={handleSelectNode}
        selectedNode={selectedNode}
      />

      <div className="grid-overlay" />

      {['A', 'B', 'C', 'D', 'E'].map((label, i) => (
        <span key={`col-${label}`} className="grid-axis-label" style={{ top: 8, left: `${(i + 1) * 120}px` }}>{label}</span>
      ))}
      {[1, 2, 3, 4].map((label, i) => (
        <span key={`row-${label}`} className="grid-axis-label" style={{ top: `${(i + 1) * 120}px`, left: 8 }}>{label}.</span>
      ))}

      <div className="absolute top-4 left-5 z-[1000]">
        <div className="w-9 h-9 rounded-md bg-card/80 backdrop-blur border border-border/40 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-foreground" />
        </div>
      </div>

      <div className="absolute top-4 right-5 z-[1000]">
        <SearchBar nodes={nodes} onSearchCity={handleSearchCity} onSelectNode={handleSelectNode} />
      </div>

      <CriticalAlertsCarousel />

      <ScopePanel activeView={activeView} onViewChange={setActiveView} />

      {/* Content panels based on active view */}
      <AnimatePresence mode="wait">
        {activeView === 'SERVICE AREA' && (
          <ServiceAreasPanel
            key="service-areas"
            nodes={nodes}
            onSelectNode={handleSelectNode}
            onFlyTo={handleFlyTo}
            onClose={() => setActiveView('GRID MAP')}
          />
        )}
        {activeView === 'POWER TIMELINE' && (
          <PowerTimelinePanel key="power-timeline" events={gridEvents} onClose={() => setActiveView('GRID MAP')} />
        )}
        {activeView === 'POWER LINES' && (
          <PowerLinesPanel key="power-lines" nodes={nodes} onFlyTo={handleFlyTo} onClose={() => setActiveView('GRID MAP')} />
        )}
      </AnimatePresence>

      <StatsPanel stats={stats} gridStatus={gridStatus} nodes={nodes} />

      <BottomToolbar stats={stats} events={gridEvents} gridStatus={gridStatus} />

      <AnimatePresence>
        {selectedNode && (
          <NodeDetailCard
            node={selectedNode}
            pixel={nodePixel}
            onClose={() => { setSelectedNode(null); setNodePixel(null); }}
            onReport={handleReport}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-background/80">
          <div className="text-[11px] text-muted-foreground tracking-widest animate-pulse">LOADING GRID DATA...</div>
        </div>
      )}
    </div>
  );
};

export default Index;
