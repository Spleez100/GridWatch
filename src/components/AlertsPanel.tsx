import { AlertTriangle, Info, Zap, Clock } from 'lucide-react';

const alerts = [
  { id: 1, title: 'Grid Disturbance — Lagos Region', message: 'Multiple areas in Lagos reporting simultaneous power outages. Possible grid collapse detected by Transmission Company of Nigeria.', severity: 'critical' as const, time: '15 min ago' },
  { id: 2, title: 'Planned Maintenance — Kubwa Axis', message: 'Abuja Electricity Distribution Company scheduled maintenance from 10AM to 2PM. Affected areas: Kubwa, Bwari, Dutse.', severity: 'info' as const, time: '1 hour ago' },
  { id: 3, title: 'Regional Outage — Ibadan South', message: 'Ibadan Electricity Distribution Company reports transmission fault affecting Challenge, Dugbe, and Ring Road areas.', severity: 'warning' as const, time: '2 hours ago' },
  { id: 4, title: 'Power Restored — Victoria Island', message: 'Eko Electricity Distribution Company confirms power restoration to Victoria Island and Ikoyi areas after 4-hour outage.', severity: 'resolved' as const, time: '3 hours ago' },
  { id: 5, title: 'Transmission Fault — Port Harcourt', message: 'Port Harcourt Electricity Distribution Company reports ongoing transmission issues. TCN working on restoration.', severity: 'critical' as const, time: '4 hours ago' },
];

const sevConfig = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  warning: { icon: Zap, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  resolved: { icon: Zap, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
};

export default function AlertsPanel() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Alerts</h2>
        <p className="text-sm text-muted-foreground">Grid disturbances, outages, and maintenance notices</p>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const cfg = sevConfig[alert.severity];
          return (
            <div key={alert.id} className={`glass-card rounded-lg p-4 border ${cfg.border}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${cfg.bg} mt-0.5`}>
                  <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{alert.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
