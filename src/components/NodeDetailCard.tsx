import { useState } from 'react';
import { PowerNode } from '@/data/nigeriaNodes';
import { X, Zap, Clock, MapPin, DollarSign, Building2, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig = {
  green: { label: 'Power Available', color: 'text-success', bg: 'bg-success/10' },
  red: { label: 'Power Outage', color: 'text-destructive', bg: 'bg-destructive/10' },
  yellow: { label: 'Unstable Supply', color: 'text-warning', bg: 'bg-warning/10' },
  blue: { label: 'Planned Maintenance', color: 'text-info', bg: 'bg-info/10' },
};

const bandDescriptions: Record<string, string> = {
  A: '20+ hours/day',
  B: '16–18 hours/day',
  C: '12–16 hours/day',
  D: '8–12 hours/day',
  E: 'Less than 8 hours/day',
};

const bandColors: Record<string, string> = {
  A: 'text-success',
  B: 'text-info',
  C: 'text-warning',
  D: 'text-warning',
  E: 'text-destructive',
};

interface Props {
  node: PowerNode;
  pixel: { x: number; y: number } | null;
  onClose: () => void;
  onReport: (node: PowerNode, type: string) => void;
}

export default function NodeDetailCard({ node, pixel, onClose, onReport }: Props) {
  const [reportSent, setReportSent] = useState<string | null>(null);
  const cfg = statusConfig[node.status];

  const handleReport = (type: string) => {
    onReport(node, type);
    setReportSent(type);
    setTimeout(() => setReportSent(null), 2000);
  };

  // Position card near the node but keep it on screen
  const style: React.CSSProperties = {};
  if (pixel) {
    const cardW = 340;
    const cardH = 420;
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={style}
      className="absolute z-[1100] w-[340px] glass-card rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'green' ? 'bg-success' : node.status === 'red' ? 'bg-destructive' : node.status === 'yellow' ? 'bg-warning' : 'bg-info'} ${node.status === 'red' ? 'animate-pulse-soft' : ''}`} />
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{node.name}</h3>
            <p className="text-xs text-muted-foreground">{node.city}, Nigeria</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors -mt-0.5">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2.5 text-sm">
        <Row icon={Zap} label="Band" value={`Band ${node.band}`} sub={bandDescriptions[node.band]} valueClass={bandColors[node.band]} />
        <Row icon={MapPin} label="Area Type" value={node.areaType} />
        <Row icon={Clock} label="Avg Supply" value={`${node.avgSupplyHours} hours/day`} />
        <Row icon={Clock} label="Last Outage" value={node.lastOutage} />
        <Row icon={DollarSign} label="Tariff" value={`₦${node.tariffPerKwh}/kWh`} />
        <Row icon={Building2} label="DisCo" value={node.disco} />
        <Row icon={Shield} label="Reliability" value={`${node.reliabilityScore}%`} valueClass={node.reliabilityScore >= 70 ? 'text-success' : node.reliabilityScore >= 40 ? 'text-warning' : 'text-destructive'} />
      </div>

      {/* Report Section */}
      <div className="px-4 py-3 border-t border-border/40">
        <p className="text-xs text-muted-foreground mb-2">Report current status</p>
        {reportSent ? (
          <div className="text-xs text-success flex items-center gap-1.5 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Report submitted — {reportSent}
          </div>
        ) : (
          <div className="flex gap-2">
            <ReportBtn icon={CheckCircle2} label="Power On" color="text-success hover:bg-success/10" onClick={() => handleReport('Power Available')} />
            <ReportBtn icon={XCircle} label="No Power" color="text-destructive hover:bg-destructive/10" onClick={() => handleReport('No Power')} />
            <ReportBtn icon={AlertTriangle} label="Unstable" color="text-warning hover:bg-warning/10" onClick={() => handleReport('Fluctuating Power')} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Row({ icon: Icon, label, value, sub, valueClass }: { icon: any; label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-xs font-medium ${valueClass || 'text-foreground'}`}>{value}</span>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function ReportBtn({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border border-border/40 transition-colors text-xs ${color}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
