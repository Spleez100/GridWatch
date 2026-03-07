import { Zap, Radio } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 z-[1002] relative">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-tight">PowerWatch NG</h1>
          <p className="text-[10px] text-muted-foreground -mt-0.5">Real-time Electricity Monitor</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-full">
          <Radio className="w-3 h-3 text-success animate-pulse-soft" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
