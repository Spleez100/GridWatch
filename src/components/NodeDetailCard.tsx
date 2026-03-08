import { useState } from 'react';
import { DbNode, statusToColor, bandExpectedHours } from '@/hooks/useGridData';
import { X, Zap, Clock, MapPin, DollarSign, Building2, Shield, AlertTriangle, CheckCircle2, XCircle, BarChart3, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const statusConfig: Record<string, { label: string; color: string }> = {
  green: { label: 'POWER AVAILABLE', color: 'text-success' },
  red: { label: 'POWER OUTAGE', color: 'text-destructive' },
  yellow: { label: 'INTERMITTENT SUPPLY', color: 'text-warning' },
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
  node: DbNode;
  pixel: { x: number; y: number } | null;
  onClose: () => void;
  onReport: (node: DbNode, type: string) => void;
  submitting?: boolean;
}

export default function NodeDetailCard({ node, pixel, onClose, onReport, submitting }: Props) {
  const [reportSent, setReportSent] = useState<string | null>(null);
  const color = statusToColor(node.status);
  const cfg = statusConfig[color] || statusConfig.yellow;
  const expectedHours = bandExpectedHours(node.band);

  const handleReport = async (type: string) => {
    onReport(node, type);
    setReportSent(type);
    setTimeout(() => setReportSent(null), 3000);
  };

  const style: React.CSSProperties = {};
  if (pixel) {
    const cardW = 300;
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

  const lastOutageText = node.last_outage
    ? `${Math.round((Date.now() - new Date(node.last_outage).getTime()) / 3600000)}h ago`
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      style={style}
      className="absolute z-[1100] w-[300px] glass-card rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-border/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-success' : color === 'red' ? 'bg-destructive' : 'bg-warning'}`} />
              <span className={`text-[10px] font-medium tracking-widest ${cfg.color}`}>{cfg.label}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{node.name}</h3>
            <p className="text-[10px] text-muted-foreground tracking-wider">{node.city}, {node.state}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-3.5 py-2.5 space-y-2 text-[11px]">
        <Row icon={Zap} label="Band" value={`Band ${node.band}`} sub={bandDescriptions[node.band]} valueClass={bandColors[node.band]} />
        <Row icon={BarChart3} label="Expected Supply" value={`${expectedHours} hrs`} />
        <Row icon={Clock} label="Actual Today" value={`${node.avg_supply_hours} hrs`} valueClass={node.avg_supply_hours < expectedHours * 0.5 ? 'text-destructive' : 'text-foreground'} />
        <Row icon={MapPin} label="Area Type" value={node.area_type} />
        <Row icon={Clock} label="Last Outage" value={lastOutageText} />
        <Row icon={DollarSign} label="Tariff" value={`₦${node.tariff_per_kwh}/kWh`} />
        <Row icon={Building2} label="DisCo" value={node.disco} />
        <Row icon={Users} label="Reports" value={`${node.report_count}`} />
        <Row icon={Shield} label="Confidence" value={`${node.confidence}%`} valueClass={node.confidence >= 70 ? 'text-success' : node.confidence >= 40 ? 'text-warning' : 'text-destructive'} />
      </div>

      <div className="px-3.5 py-2.5 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground mb-2 tracking-widest uppercase">Report Power Status</p>
        {reportSent ? (
          <div className="text-[10px] text-success flex items-center gap-1.5 py-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span className="tracking-wider">Report submitted — {reportSent}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <ReportBtn icon={CheckCircle2} label="Power On" color="text-success hover:bg-success/10" onClick={() => handleReport('Power Available')} disabled={submitting} />
              <ReportBtn icon={XCircle} label="No Power" color="text-destructive hover:bg-destructive/10" onClick={() => handleReport('No Power')} disabled={submitting} />
              <ReportBtn icon={AlertTriangle} label="Unstable" color="text-warning hover:bg-warning/10" onClick={() => handleReport('Intermittent Supply')} disabled={submitting} />
            </div>
            <button
              onClick={onClose}
              className="w-full text-[9px] tracking-wider text-muted-foreground hover:text-foreground py-1.5 rounded border border-border/30 hover:bg-accent/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Row({ icon: Icon, label, value, sub, valueClass }: { icon: any; label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3 h-3 shrink-0" />
        <span className="text-[10px] tracking-wider">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-[10px] font-medium ${valueClass || 'text-foreground'}`}>{value}</span>
        {sub && <p className="text-[8px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function ReportBtn({ icon: Icon, label, color, onClick, disabled }: { icon: any; label: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded border border-border/30 transition-colors text-[9px] tracking-wider ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
