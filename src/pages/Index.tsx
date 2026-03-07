import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppHeader from '@/components/AppHeader';
import NavigationTabs from '@/components/NavigationTabs';
import ElectricityMap from '@/components/ElectricityMap';
import SearchBar from '@/components/SearchBar';
import ReportButton from '@/components/ReportButton';
import StatusLegend from '@/components/StatusLegend';
import NodeDetailCard from '@/components/NodeDetailCard';
import AlertBanner from '@/components/AlertBanner';
import InsightsDashboard from '@/components/InsightsDashboard';
import ReportsPanel from '@/components/ReportsPanel';
import AlertsPanel from '@/components/AlertsPanel';
import { PowerNode } from '@/data/nigeriaNodes';

type Tab = 'map' | 'reports' | 'alerts' | 'insights';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [searchCity, setSearchCity] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PowerNode | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AppHeader />
      <div className="hidden md:block">
        <NavigationTabs active={activeTab} onChange={setActiveTab} />
      </div>

      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <>
            <ElectricityMap
              searchCity={searchCity}
              onClearSearch={() => setSearchCity(null)}
              onSelectNode={setSelectedNode}
              selectedNode={selectedNode}
            />
            <SearchBar onSearchCity={setSearchCity} onSelectNode={setSelectedNode} />
            <AlertBanner />
            <StatusLegend />
            <ReportButton />
            <AnimatePresence>
              {selectedNode && (
                <NodeDetailCard node={selectedNode} onClose={() => setSelectedNode(null)} />
              )}
            </AnimatePresence>
          </>
        )}
        {activeTab === 'reports' && <ReportsPanel />}
        {activeTab === 'alerts' && <AlertsPanel />}
        {activeTab === 'insights' && <InsightsDashboard />}
      </main>

      <div className="md:hidden">
        <NavigationTabs active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
