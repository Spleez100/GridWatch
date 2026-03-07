import { powerNodes } from '@/data/nigeriaNodes';
import { Clock, MapPin, Zap, ZapOff, Activity } from 'lucide-react';

const mockReports = [
  { area: 'Ikeja GRA', city: 'Lagos', type: 'power', time: '2 min ago', user: 'Anonymous' },
  { area: 'Mushin', city: 'Lagos', type: 'outage', time: '5 min ago', user: 'Anonymous' },
  { area: 'Kubwa', city: 'Abuja', type: 'outage', time: '8 min ago', user: 'Anonymous' },
  { area: 'Victoria Island', city: 'Lagos', type: 'power', time: '12 min ago', user: 'Anonymous' },
  { area: 'Bodija', city: 'Ibadan', type: 'fluctuating', time: '15 min ago', user: 'Anonymous' },
  { area: 'GRA Phase 2', city: 'Port Harcourt', type: 'power', time: '18 min ago', user: 'Anonymous' },
  { area: 'Dugbe', city: 'Ibadan', type: 'outage', time: '22 min ago', user: 'Anonymous' },
  { area: 'Gwarinpa', city: 'Abuja', type: 'fluctuating', time: '25 min ago', user: 'Anonymous' },
  { area: 'Oyigbo', city: 'Port Harcourt', type: 'outage', time: '30 min ago', user: 'Anonymous' },
  { area: 'Lekki Phase 1', city: 'Lagos', type: 'power', time: '35 min ago', user: 'Anonymous' },
];

const typeConfig = {
  power: { icon: Zap, label: 'Power Available', color: 'text-success', bg: 'bg-success/10' },
  outage: { icon: ZapOff, label: 'No Power', color: 'text-destructive', bg: 'bg-destructive/10' },
  fluctuating: { icon: Activity, label: 'Fluctuating', color: 'text-warning', bg: 'bg-warning/10' },
};

export default function ReportsPanel() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Recent Reports</h2>
        <p className="text-sm text-muted-foreground">Crowd-sourced electricity status updates</p>
      </div>
      <div className="space-y-2">
        {mockReports.map((report, i) => {
          const cfg = typeConfig[report.type as keyof typeof typeConfig];
          return (
            <div key={i} className="glass-card rounded-lg p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded-md ${cfg.bg}`}>
                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{report.area}</p>
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{report.city}</span>
                  <Clock className="w-3 h-3 text-muted-foreground ml-1" />
                  <span className="text-xs text-muted-foreground">{report.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
