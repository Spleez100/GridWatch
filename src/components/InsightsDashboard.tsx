import { powerNodes } from '@/data/nigeriaNodes';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';

export default function InsightsDashboard() {
  const cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt'];

  const cityData = cities.map((city) => {
    const nodes = powerNodes.filter((n) => n.city === city);
    const avgHours = Math.round(nodes.reduce((sum, n) => sum + n.avgSupplyHours, 0) / nodes.length);
    const avgReliability = Math.round(nodes.reduce((sum, n) => sum + n.reliabilityScore, 0) / nodes.length);
    return { city, avgHours, avgReliability, nodes: nodes.length };
  });

  const topAreas = [...powerNodes].sort((a, b) => b.reliabilityScore - a.reliabilityScore).slice(0, 5);
  const worstAreas = [...powerNodes].sort((a, b) => a.reliabilityScore - b.reliabilityScore).slice(0, 5);

  const totalNodes = powerNodes.length;
  const greenCount = powerNodes.filter((n) => n.status === 'green').length;
  const nationalAvg = Math.round(powerNodes.reduce((s, n) => s + n.avgSupplyHours, 0) / totalNodes);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Electricity Insights</h2>
        <p className="text-sm text-muted-foreground">National power supply analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Areas Online" value={`${greenCount}/${totalNodes}`} trend="up" />
        <StatCard icon={Clock} label="National Avg" value={`${nationalAvg}h/day`} trend={nationalAvg > 12 ? 'up' : 'down'} />
        <StatCard icon={TrendingUp} label="Best City" value={cityData.sort((a, b) => b.avgHours - a.avgHours)[0].city} trend="up" />
        <StatCard icon={TrendingDown} label="Most Outages" value={cityData.sort((a, b) => a.avgHours - b.avgHours)[0].city} trend="down" />
      </div>

      {/* City Comparison Chart */}
      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Average Daily Supply Hours by City</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cityData}>
            <XAxis dataKey="city" tick={{ fill: 'hsl(215 9% 58%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(215 9% 58%)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 24]} />
            <Tooltip
              contentStyle={{ background: 'hsl(216 20% 11%)', border: '1px solid hsl(216 14% 18%)', borderRadius: '8px', color: 'hsl(210 33% 93%)' }}
              itemStyle={{ color: 'hsl(210 33% 93%)' }}
            />
            <Bar dataKey="avgHours" radius={[6, 6, 0, 0]} name="Avg Hours">
              {cityData.map((entry, i) => (
                <Cell key={i} fill={entry.avgHours >= 16 ? 'hsl(142 71% 45%)' : entry.avgHours >= 10 ? 'hsl(45 93% 47%)' : 'hsl(0 72% 51%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankingList title="Most Reliable Areas" items={topAreas} type="best" />
        <RankingList title="Most Frequent Outages" items={worstAreas} type="worst" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend: 'up' | 'down' }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function RankingList({ title, items, type }: { title: string; items: typeof powerNodes; type: 'best' | 'worst' }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <div>
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.city}</p>
              </div>
            </div>
            <span className={`text-sm font-medium ${type === 'best' ? 'text-success' : 'text-destructive'}`}>
              {item.reliabilityScore}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
