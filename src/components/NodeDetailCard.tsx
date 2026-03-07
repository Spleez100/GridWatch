import { PowerNode } from '@/data/nigeriaNodes';
import { X, Zap, Clock, MapPin, Users, Shield, DollarSign, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PowerTimeline from './PowerTimeline';

const statusConfig = {
  green: { label: 'Power Available', color: 'text-success', bg: 'bg-success/10', glow: 'glow-green' },
  red: { label: 'Power Outage', color: 'text-destructive', bg: 'bg-destructive/10', glow: 'glow-red' },
  yellow: { label: 'Unstable Supply', color: 'text-warning', bg: 'bg-warning/10', glow: 'glow-yellow' },
  blue: { label: 'Planned Maintenance', color: 'text-info', bg: 'bg-info/10', glow: 'glow-blue' },
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
  onClose: () => void;
}

export default function NodeDetailCard({ node, onClose }: Props) {
  const cfg = statusConfig[node.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 z-[1000] w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto glass-card rounded-lg"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cfg.bg} ${node.status === 'red' ? 'animate-pulse-soft' : ''}`}>
              <div className={`w-full h-full rounded-full ${cfg.bg}`} />
            </div>
            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-foreground">{node.name}</h3>
        <p className="text-sm text-muted-foreground">{node.city}, Nigeria</p>
      </div>

      {/* Details Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <DetailItem icon={Building2} label="DisCo" value={node.disco} />
        <DetailItem icon={Zap} label="Band" value={`Band ${node.band}`} valueClass={bandColors[node.band]} />
        <DetailItem icon={MapPin} label="Area Type" value={node.areaType} />
        <DetailItem icon={Clock} label="Avg Supply" value={`${node.avgSupplyHours}h/day`} />
        <DetailItem icon={Clock} label="Last Outage" value={node.lastOutage} />
        <DetailItem icon={DollarSign} label="Tariff" value={`₦${node.tariffPerKwh}/kWh`} />
        <DetailItem icon={Users} label="Reports" value={`${node.reportCount}`} />
        <DetailItem icon={Shield} label="Reliability" value={`${node.reliabilityScore}%`} valueClass={node.reliabilityScore >= 70 ? 'text-success' : node.reliabilityScore >= 40 ? 'text-warning' : 'text-destructive'} />
      </div>

      {/* Timeline */}
      <div className="p-4 border-t border-border/50">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Power Timeline — Today</h4>
        <PowerTimeline timeline={node.timeline} />
      </div>
    </motion.div>
  );
}

function DetailItem({ icon: Icon, label, value, valueClass }: { icon: any; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${valueClass || 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}
