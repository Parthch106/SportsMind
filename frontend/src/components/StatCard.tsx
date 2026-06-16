'use client';

import { Metric } from '@/lib/api';

interface StatCardProps {
  metrics: Metric[];
  confidence: number;
  opponent: string;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="mt-1">
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000 ease-out"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function StatCard({ metrics, confidence, opponent }: StatCardProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 shadow-xl">
      {/* Gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Predicted Stats</h3>
          {opponent && <p className="text-xs text-white/30">vs {opponent}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {metrics && metrics.map((m, i) => (
          <div key={i} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider h-6">{m.label}</p>
            <p className={`text-3xl font-bold bg-clip-text text-transparent tracking-tight ${i === 0 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-violet-400 to-pink-400'}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-white/40">Model confidence</span>
          <span className="text-white/60 font-semibold">{(confidence * 100).toFixed(0)}%</span>
        </div>
        <ConfidenceBar value={confidence} />
      </div>
    </div>
  );
}
