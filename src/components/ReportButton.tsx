import { useState } from 'react';
import { Zap, ZapOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ReportButton() {
  const [open, setOpen] = useState(false);

  const report = (type: string) => {
    toast.success(`Report submitted: ${type}`, {
      description: 'Your report helps improve electricity data for your area.',
    });
    setOpen(false);
  };

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="glass-card rounded-lg p-2 flex flex-col gap-1.5 min-w-[200px]"
          >
            <button onClick={() => report('I have electricity')} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-success/10 transition-colors text-left">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">I have electricity</span>
            </button>
            <button onClick={() => report('No electricity')} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-destructive/10 transition-colors text-left">
              <ZapOff className="w-4 h-4 text-destructive" />
              <span className="text-sm text-foreground">No electricity</span>
            </button>
            <button onClick={() => report('Power fluctuating')} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-warning/10 transition-colors text-left">
              <Activity className="w-4 h-4 text-warning" />
              <span className="text-sm text-foreground">Power fluctuating</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 py-3 font-medium text-sm shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Report Power Status
      </button>
    </div>
  );
}
