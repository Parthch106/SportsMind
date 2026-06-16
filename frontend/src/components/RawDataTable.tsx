'use client';

import { RawMatch } from '@/lib/api';
import { Database } from 'lucide-react';

interface RawDataTableProps {
  matches: RawMatch[];
}

export default function RawDataTable({ matches }: RawDataTableProps) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="panel-glow bg-[#060d14]/80 p-6 rounded-xl border border-emerald-500/20 w-full mt-6">
      <h2 className="text-xs uppercase tracking-widest text-emerald-500/60 mb-4 font-bold flex items-center gap-2">
        <Database className="w-4 h-4" />
        Raw Match History
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-emerald-100/60 font-mono">
          <thead className="text-[10px] uppercase tracking-wider text-emerald-500/40 border-b border-emerald-500/20">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Opponent</th>
              <th className="px-4 py-3 font-semibold text-right">xG</th>
              <th className="px-4 py-3 font-semibold text-right">Goals</th>
              <th className="px-4 py-3 font-semibold text-right">Passes</th>
              <th className="px-4 py-3 font-semibold text-right">Prog Carries</th>
              <th className="px-4 py-3 font-semibold text-right">Sprint (m)</th>
              <th className="px-4 py-3 font-semibold text-right">High Int.</th>
              <th className="px-4 py-3 font-semibold text-right">Mins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10">
            {matches.map((match, idx) => (
              <tr key={idx} className="hover:bg-emerald-500/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{match.match_date}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${match.is_home ? 'bg-emerald-500' : 'bg-emerald-500/30'}`} title={match.is_home ? "Home" : "Away"} />
                  {match.opponent}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">{match.xg.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{match.goals}</td>
                <td className="px-4 py-3 text-right">{match.passes}</td>
                <td className="px-4 py-3 text-right">{match.progressive_carries}</td>
                <td className="px-4 py-3 text-right">{match.sprint_distance.toFixed(0)}</td>
                <td className="px-4 py-3 text-right">{match.high_intensity}</td>
                <td className="px-4 py-3 text-right">{match.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-[10px] text-emerald-500/30 uppercase tracking-widest border-t border-emerald-500/10 pt-4">
        <span>Showing last {matches.length} matches</span>
        <span className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500" /> Home
           <span className="w-2 h-2 rounded-full bg-emerald-500/30 ml-2" /> Away
        </span>
      </div>
    </div>
  );
}
