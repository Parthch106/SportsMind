'use client';

import Link from 'next/link';
import { Activity, ShieldAlert, Navigation, Cpu, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

const MODULES = [
  {
    id: 'directory',
    name: 'Player Directory',
    desc: 'Browse leagues, teams, and active profiles',
    href: '/directory',
    icon: Navigation,
    color: 'emerald',
  },
  {
    id: 'live',
    name: 'Live Match Center',
    desc: 'Real-time telemetry and simulated AI commentary feed',
    href: '/live',
    icon: Radio,
    color: 'rose',
  },
  {
    id: 'performance',
    name: 'Performance Predictor',
    desc: 'XGBoost regression for xG and Key Passes',
    href: '/performance',
    icon: Activity,
    color: 'emerald',
  },
  {
    id: 'injury',
    name: 'Injury Risk Analyzer',
    desc: 'Workload tracking and ML risk classification',
    href: '/injury',
    icon: ShieldAlert,
    color: 'amber',
  },
  {
    id: 'tactics',
    name: 'Tactical Analysis',
    desc: 'K-Means spatial clustering and heatmaps',
    href: '/tactics',
    icon: Activity,
    color: 'blue',
  },
];

export default function CommandCenter() {
  const [health, setHealth] = useState<{ status: string; models_loaded: Record<string, boolean> } | null>(null);

  useEffect(() => {
    checkHealth().then(setHealth).catch(console.error);
  }, []);

  return (
    <div className="p-8 min-h-[calc(100vh-2rem)] flex flex-col justify-center max-w-6xl mx-auto">
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <h1 className="text-5xl md:text-7xl font-bold font-[var(--font-space)] tracking-tight mb-4 relative">
          <span className="text-white">SPORTS</span>
          <span className="text-emerald-400">MIND</span>
        </h1>
        <p className="text-emerald-500/50 uppercase tracking-[0.3em] font-mono text-sm">
          Global Intelligence Command Center
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const isLoaded = health?.models_loaded?.[m.id] ?? true; // Default true if endpoint fails/ignores
          
          // Map color strings to tailwind classes since dynamic interpolation can be tricky
          const colorMap: Record<string, string> = {
            emerald: 'hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] text-emerald-400',
            amber: 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] text-amber-400',
            blue: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] text-blue-400',
            violet: 'hover:border-violet-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] text-violet-400',
            rose: 'hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(243,24,73,0.15)] text-rose-400',
          };

          return (
            <Link
              key={m.id}
              href={m.href}
              className={`group bg-[#060d14]/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl transition-all duration-500 ${colorMap[m.color]} relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 blur-3xl rounded-full group-hover:opacity-20 transition-opacity duration-500" />
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-current bg-opacity-10 flex items-center justify-center border border-current border-opacity-20">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-mono text-white/40 uppercase">
                    {isLoaded ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold font-[var(--font-space)] text-white mb-2 relative z-10">
                {m.name}
              </h2>
              <p className="text-sm text-white/40 font-mono relative z-10">
                {m.desc}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center text-white/20 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-4">
        <span>System running</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>V1.0.0-STABLE</span>
      </div>
    </div>
  );
}
