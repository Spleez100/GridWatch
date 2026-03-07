interface TimelineEntry {
  time: string;
  status: 'power' | 'outage';
}

export default function PowerTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <div>
      <div className="flex gap-0.5 h-6 rounded-md overflow-hidden">
        {timeline.map((entry, i) => (
          <div
            key={i}
            className={`flex-1 ${entry.status === 'power' ? 'bg-success/70' : 'bg-destructive/50'}`}
            title={`${entry.time} — ${entry.status === 'power' ? 'Power' : 'Outage'}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">12AM</span>
        <span className="text-[10px] text-muted-foreground">6AM</span>
        <span className="text-[10px] text-muted-foreground">12PM</span>
        <span className="text-[10px] text-muted-foreground">6PM</span>
        <span className="text-[10px] text-muted-foreground">12AM</span>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-success/70" />
          <span className="text-[10px] text-muted-foreground">Power</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-destructive/50" />
          <span className="text-[10px] text-muted-foreground">Outage</span>
        </div>
      </div>
    </div>
  );
}
