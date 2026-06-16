'use client';

import { usePathname } from 'next/navigation';

import { useAnalysis } from '@/contexts/AnalysisContext';
import { Star, Shield, Target } from 'lucide-react';

export default function PlayerProfileHeader() {
  const { data } = useAnalysis();
  const pathname = usePathname();

  const hiddenPaths = ['/dashboard', '/directory', '/live'];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  if (!data || !data.player_name || data.player_name === 'Unknown Player') {
    return null; // Don't render anything if no player is active or player is unknown
  }

  // Calculate a mock SofaScore style rating based on predicted xG and KP
  const xG = data.performance?.predicted_xg || 0.5;
  const kP = data.performance?.predicted_key_passes || 1.0;
  
  // Base rating 6.0, add up to 3.5 points based on impact
  let formRating = 6.0 + (xG * 2.0) + (kP * 0.5);
  formRating = Math.min(9.9, Math.max(3.0, formRating));
  
  // Rating color logic
  let ratingColor = 'bg-emerald-500'; // high
  if (formRating < 6.5) ratingColor = 'bg-red-500';
  else if (formRating < 7.5) ratingColor = 'bg-amber-500';
  else if (formRating < 8.5) ratingColor = 'bg-cyan-500';

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.player_name)}&background=060d14&color=10b981&size=256&rounded=true&bold=true`;

  return (
    <div className="bg-[#03060a]/95 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar Image */}
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-cyan-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src={avatarUrl} 
              alt={data.player_name} 
              className="w-32 h-32 rounded-full border-2 border-emerald-500/30 object-cover relative z-10 shadow-xl"
            />
          </div>

          {/* Bio Information */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black font-[var(--font-space)] text-white tracking-wide mb-2 drop-shadow-md">
              {data.player_name.toUpperCase()}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-mono text-emerald-100/60">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold uppercase">
                <Shield className="w-4 h-4" />
                {data.position || 'UNKNOWN'}
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {data.performance?.opponent && data.performance.opponent !== 'Opponent' 
                  ? `Next vs ${data.performance.opponent}` 
                  : 'Next Match'}
              </span>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-white/40">
              <div className="flex flex-col">
                <span className="uppercase tracking-widest mb-1">Age</span>
                <span className="text-white/80 font-bold text-base">{data.player_bio?.age || '--'}</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-widest mb-1">Foot</span>
                <span className="text-white/80 font-bold text-base">{data.player_bio?.foot || '--'}</span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-widest mb-1">Height</span>
                <span className="text-white/80 font-bold text-base">{data.player_bio?.height || '--'}</span>
              </div>
            </div>
          </div>

          {/* SofaScore Style Rating */}
          <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden min-w-[120px]">
             <div className="absolute top-0 right-0 p-2 opacity-5">
                <Star className="w-16 h-16" />
             </div>
             <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold z-10">Form Rating</p>
             <div className={`text-3xl font-black text-white px-4 py-2 rounded-xl z-10 ${ratingColor} shadow-lg`}>
               {formRating.toFixed(1)}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
