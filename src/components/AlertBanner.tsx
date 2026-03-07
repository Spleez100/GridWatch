import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const alerts = [
  { id: 1, message: 'Grid disturbance detected — Multiple regions in Lagos reporting simultaneous outages', severity: 'critical' as const },
  { id: 2, message: 'Planned maintenance: Abuja Electricity Distribution Company — Kubwa axis, 10AM-2PM', severity: 'info' as const },
];

export default function AlertBanner() {
  const [visible, setVisible] = useState(true);
  const [currentAlert, setCurrentAlert] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlert((c) => (c + 1) % alerts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const alert = alerts[currentAlert];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1001] glass-card rounded-lg px-4 py-2.5 flex items-center gap-3 max-w-[600px] ${
          alert.severity === 'critical' ? 'border-destructive/30' : 'border-info/30'
        }`}
      >
        <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-info'}`} />
        <p className="text-xs text-foreground">{alert.message}</p>
        <button onClick={() => setVisible(false)} className="p-0.5 hover:bg-accent rounded transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
