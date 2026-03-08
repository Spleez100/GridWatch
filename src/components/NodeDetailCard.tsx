import { useState } from 'react';
import { DbNode } from '@/hooks/useGridData';
import { X, CheckCircle2, XCircle, AlertTriangle, MapPin, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const statusLabels: Record<string, { label: string; colorClass: string }> = {
  green: { label: 'Light is On', colorClass: 'text-success' },
  red: { label: 'No Light', colorClass: 'text-destructive' },
  yellow: { label: 'Light Unstable', colorClass: 'text-warning' },
  gray: { label: 'Unknown', colorClass: 'text-muted-foreground' },
};

function statusColor(status: string) {
  if (status === 'POWER_AVAILABLE') return 'green';
  if (status === 'OUTAGE') return 'red';
  if (status === 'UNKNOWN') return 'gray';
  return 'yellow';
}

interface Props {
  node: DbNode;
  pixel: { x: number; y: number } | null;
  onClose: () => void;
  onReport: (node: DbNode, type: string) => void;
  submitting?: boolean;
  onViewInfrastructure?: () => void;
}

export default function NodeDetailCard({ node, pixel, onClose, onReport, submitting }: Props) {
  const [reportSent, setReportSent] = useState<string | null>(null);
  const color = statusColor(node.status);
  const cfg = statusLabels[color] || statusLabels.yellow;

  const handleReport = async (type: string) => {
    onReport(node, type);
    setReportSent(type);
    setTimeout(() => setReportSent(null), 3000);
  };

  const style: React.CSSProperties = {};
  if (pixel) {
    const cardW = 280;
    const cardH = 300;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    let left = pixel.x + 20;
    let top = pixel.y - 40;
    if (left + cardW > vw - 16) left = pixel.x - cardW - 20;
    if (top + cardH > vh - 16) top = vh - cardH - 16;
    if (top < 60) top = 60;
    if (left < 16) left = 16;
    style.left = left;
    style.top = top;
    style.right = 'auto';
  } else {
    style.right = 16;
    style.top = 60;
  }

  const lastOutageText = node.last_outage
    ? `${Math.round((Date.now() - new Date(node.last_outage).getTime()) / 3600000)}h ago`
    : 'No recent outage';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      style={style}
      className="absolute z-[1100] w-[280px] glass-card rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${color === 'green' ? 'bg-success' : color === 'red' ? 'bg-destructive' : 'bg-warning'}`} />
              <span className={`text-xs font-semibold ${cfg.colorClass}`}>{cfg.label}</span>
            </div>
            <h3 className="text-sm font-bold text-foreground">{node.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">{node.city}, {node.state}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Simple info */}
      <div className="px-3.5 py-3 space-y-2.5 text-[11px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Average daily supply</span>
          </div>
          <span className="font-semibold text-foreground">{node.avg_supply_hours} hrs</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Last outage</span>
          </div>
          <span className="font-medium text-foreground">{lastOutageText}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>Reports from people</span>
          </div>
          <span className="font-medium text-foreground">{node.report_count}</span>
        </div>
      </div>

      {/* Report section */}
      <div className="px-3.5 py-3 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground mb-2.5 font-medium">Do you have light right now?</p>
        {reportSent ? (
          <div className="text-xs text-success flex items-center gap-1.5 py-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thanks! Your report was sent.</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleReport('Power Available')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-success/30 text-success hover:bg-success/10 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Yes
            </button>
            <button
              onClick={() => handleReport('No Power')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              No
            </button>
            <button
              onClick={() => handleReport('Intermittent Supply')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-warning/30 text-warning hover:bg-warning/10 transition-colors text-xs font-medium disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Unstable
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
