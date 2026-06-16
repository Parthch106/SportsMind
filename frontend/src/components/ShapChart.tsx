'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Driver {
  feature: string;
  value: number;
  impact: string;
}

interface ShapChartProps {
  drivers: Driver[];
}

// Shorten long feature names for axis labels
function shorten(name: string): string {
  const map: Record<string, string> = {
    'Recent form (5-match xG average)': 'Form (xG avg)',
    'Recent passing volume': 'Passing vol.',
    'Physical load (sprint distance)': 'Sprint load',
    'Opponent defensive strength': 'Opp. defence',
    'Opponent press intensity (PPDA)': 'Press (PPDA)',
    'Home advantage': 'Home adv.',
    'Recovery time': 'Recovery',
    'Historical xG vs this opponent': 'vs Opponent hist.',
    'Season form score': 'Season form',
    'Player age': 'Age',
    'Fixture congestion (14 days)': 'Congestion',
    'Minutes load (14 days)': 'Min. load',
  };
  return map[name] ?? name.slice(0, 18);
}

function parseImpact(impact: string): number {
  // Impact is like "+0.31 xG" or "-0.10 xG"
  const match = impact.match(/([+-]?\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { feature: string; impact: string; impactVal: number; value: number | string } }> }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#0f1823]/95 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-white font-medium mb-1">{d.feature}</p>
        <p className="text-white/50">Impact: <span className={d.impactVal >= 0 ? 'text-emerald-400' : 'text-red-400'}>{d.impact}</span></p>
        <p className="text-white/50">Value: {d.value}</p>
      </div>
    );
  }
  return null;
};

export default function ShapChart({ drivers }: ShapChartProps) {
  const data = drivers.map((d) => ({
    ...d,
    label: shorten(d.feature),
    impactVal: parseImpact(d.impact),
  }));

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 shadow-xl">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
          </svg>
        </div>
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Top SHAP Drivers</h3>
      </div>

      {data.length === 0 ? (
        <p className="text-white/25 text-sm text-center py-4">No SHAP data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="impactVal" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.impactVal >= 0
                      ? 'url(#positiveGradient)'
                      : 'url(#negativeGradient)'
                  }
                />
              ))}
            </Bar>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.9} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
