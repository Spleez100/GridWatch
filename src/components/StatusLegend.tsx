import { powerNodes } from '@/data/nigeriaNodes';

export default function StatusLegend() {
  const counts = {
    green: powerNodes.filter(n => n.status === 'green').length,
    red: powerNodes.filter(n => n.status === 'red').length,
    yellow: powerNodes.filter(n => n.status === 'yellow').length,
    blue: powerNodes.filter(n => n.status === 'blue').length,
  };

  const items = [
    { color: 'bg-success', label: 'Power On', count: counts.green },
    { color: 'bg-destructive', label: 'Outage', count: counts.red },
    { color: 'bg-warning', label: 'Unstable', count: counts.yellow },
    { color: 'bg-info', label: 'Maintenance', count: counts.blue },
  ];

  return (
    <div className="absolute bottom-6 left-4 z-[1000] glass-card rounded-lg px-4 py-3 flex gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <span className="text-xs font-medium text-foreground">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
