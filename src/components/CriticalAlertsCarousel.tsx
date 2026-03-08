import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, ZapOff, ChevronLeft, ChevronRight, Radio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CriticalNode {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  severity: string;
  confidence: number;
  report_count: number;
  last_outage: string | null;
}

export default function CriticalAlertsCarousel() {
  const [criticalNodes, setCriticalNodes] = useState<CriticalNode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('nodes')
      .select('id, name, city, state, status, severity, confidence, report_count, last_outage')
      .in('severity', ['CRITICAL', 'HIGH'])
      .order('confidence', { ascending: false })
      .limit(20);
    if (data) setCriticalNodes(data as CriticalNode[]);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    const channel = supabase
      .channel('critical-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nodes', filter: 'severity=in.(CRITICAL,HIGH)' }, () => fetchData())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => {
    if (criticalNodes.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % criticalNodes.length), 5000);
    return () => clearInterval(timer);
  }, [criticalNodes.length]);

  if (criticalNodes.length === 0) return null;

  const currentNode = criticalNodes[currentIndex];

  const getDuration = (lastOutage: string | null) => {
    if (!lastOutage) return 'Unknown';
    const hours = Math.round((Date.now() - new Date(lastOutage).getTime()) / 3600000);
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  const prev = () => setCurrentIndex((i) => (i - 1 + criticalNodes.length) % criticalNodes.length);
  const next = () => setCurrentIndex((i) => (i + 1) % criticalNodes.length);

  return (
    <div className="absolute top-4 left-16 z-[1000] max-w-[300px]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card rounded-t-lg w-full px-3 py-2 flex items-center gap-2 hover:bg-accent/30 transition-colors"
      >
        <div className="relative">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-[7px] font-bold text-destructive-foreground flex items-center justify-center">
            {criticalNodes.length}
          </span>
        </div>
        <span className="text-[11px] font-medium text-foreground">
          ⚡ {criticalNodes.length} areas without light
        </span>
        <Radio className="w-3 h-3 text-destructive ml-auto animate-pulse" />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {currentNode && (
              <div className="glass-card border-t-0 rounded-b-lg px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={prev} className="p-0.5 rounded hover:bg-accent/40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <span className="text-[9px] text-muted-foreground">
                    {currentIndex + 1} of {criticalNodes.length}
                  </span>
                  <button onClick={next} className="p-0.5 rounded hover:bg-accent/40 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentNode.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${currentNode.severity === 'CRITICAL' ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{currentNode.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{currentNode.city}, {currentNode.state}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-destructive font-medium flex items-center gap-1">
                          <ZapOff className="w-3 h-3" />
                          {currentNode.status === 'OUTAGE' ? 'No light' : 'Unstable'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">How long</span>
                        <span className="text-foreground">{getDuration(currentNode.last_outage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">People reporting</span>
                        <span className="text-foreground">{currentNode.report_count}</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-1 mt-2.5">
                  {criticalNodes.slice(0, 8).map((_, i) => (
                    <button key={i} onClick={() => setCurrentIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-destructive' : 'bg-border'}`} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
