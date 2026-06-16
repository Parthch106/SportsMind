'use client';

import { useState, useEffect } from 'react';
import { Radio, Flame, ShieldAlert, ArrowRight, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock live events
const LIVE_EVENTS = [
  { time: '12:04', type: 'INFO', text: 'Match kicks off. High intensity from the start.' },
  { time: '18:22', type: 'TACTIC', text: 'SYS.ANALYSIS: Opponent shifting to a low block. Zone 14 congestion detected.' },
  { time: '24:15', type: 'DANGER', text: 'SYS.WARNING: Left-back workload spiking. 15 sprints in 10 mins. Injury risk elevated.' },
  { time: '31:40', type: 'CHANCE', text: 'Big chance created down the right channel. xG for that shot: 0.35.' },
  { time: '41:10', type: 'TACTIC', text: 'SYS.ANALYSIS: Pressing intensity dropping by 12%. PPDA increased to 14.2.' },
];

export default function LiveMatchCenter() {
  const [matchTime, setMatchTime] = useState(0); // in seconds
  const [events, setEvents] = useState<typeof LIVE_EVENTS>([]);
  const [homeScore] = useState(0);
  const [awayScore] = useState(0);
  const [momentum, setMomentum] = useState(50); // 0 to 100

  // Simulate ticking clock and events
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchTime(prev => {
        const nextTime = prev + 1;
        // Format as MM:SS
        const m = Math.floor(nextTime / 60);
        const s = nextTime % 60;
        const formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        // Add events if time matches
        const newEvent = LIVE_EVENTS.find(e => e.time === formattedTime);
        if (newEvent) {
          setEvents(curr => [newEvent, ...curr]);
          // Randomly shift momentum on events
          setMomentum(Math.max(10, Math.min(90, momentum + (Math.random() * 40 - 20))));
        }

        return nextTime;
      });
    }, 100); // Super fast 1s = 100ms for demo purposes

    return () => clearInterval(interval);
  }, [momentum]);

  const m = Math.floor(matchTime / 60);
  const s = matchTime % 60;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TACTIC': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'DANGER': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'CHANCE': return <Flame className="w-4 h-4 text-amber-400" />;
      default: return <ArrowRight className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-8 pb-20 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-space)] text-rose-500 flex items-center gap-3">
            <Radio className="w-8 h-8 animate-pulse" />
            Live Match Center
          </h1>
          <p className="text-rose-500/50 text-sm mt-1 uppercase tracking-widest font-mono">
            SYS.MOD.05 // Real-time Telemetry
          </p>
        </div>
        
        {/* Scoreboard */}
        <div className="flex items-center gap-6 bg-[#060d14]/80 p-4 rounded-xl border border-rose-500/20 shadow-[0_0_20px_rgba(243,24,73,0.1)]">
          <div className="text-right">
            <p className="text-xs text-white/50 font-mono">HOME</p>
            <p className="text-3xl font-bold font-[var(--font-space)] text-white">{homeScore}</p>
          </div>
          <div className="flex flex-col items-center px-4 border-x border-white/10">
            <Clock className="w-4 h-4 text-rose-500 mb-1" />
            <p className="text-xl font-mono font-bold text-rose-400">
              {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/50 font-mono">AWAY</p>
            <p className="text-3xl font-bold font-[var(--font-space)] text-white">{awayScore}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: AI Commentary Feed */}
        <div className="lg:col-span-2 shadow-[0_0_20px_rgba(243,24,73,0.05)] bg-[#03060a]/90 rounded-xl border border-rose-500/20 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="p-6 border-b border-rose-500/10 flex items-center justify-between">
            <h2 className="font-mono text-xs text-rose-500/60 flex items-center gap-2">
              <Radio className="w-4 h-4" /> LIVE CO-PILOT ANALYSIS
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] text-rose-500/50 tracking-widest uppercase">Streaming</span>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto flex flex-col-reverse gap-4">
            <AnimatePresence>
              {events.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/20 font-mono text-sm text-center my-auto">
                  WAITING FOR KICKOFF...
                </motion.p>
              )}
              {events.map((ev, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="text-rose-400 font-mono text-xs font-bold shrink-0">{ev.time}</div>
                  <div className="mt-0.5">{getEventIcon(ev.type)}</div>
                  <p className="text-sm text-white/80 leading-relaxed font-sans">{ev.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Real-time Telemetry (Momentum) */}
        <div className="lg:col-span-1 shadow-[0_0_20px_rgba(243,24,73,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-rose-500/20 flex flex-col">
          <h2 className="font-mono text-xs text-rose-500/60 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> LIVE MOMENTUM
          </h2>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Custom Momentum Gauge */}
            <div className="relative w-full h-8 bg-white/5 rounded-full overflow-hidden border border-white/10 flex items-center">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                animate={{ width: `${momentum}%` }}
                transition={{ type: 'spring', bounce: 0.2 }}
              />
              <motion.div 
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-rose-500 to-rose-400"
                animate={{ width: `${100 - momentum}%` }}
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-3 text-xs font-mono text-white/40">
              <span>HOME PRESSURE</span>
              <span>AWAY PRESSURE</span>
            </div>

            <div className="mt-12 space-y-4">
               <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <p className="text-[10px] text-rose-400/60 font-mono mb-1">XG ACCUMULATOR</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold font-[var(--font-space)] text-rose-400">0.84</span>
                    <span className="text-xs text-white/30">vs 0.21</span>
                  </div>
               </div>
               <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-[10px] text-emerald-400/60 font-mono mb-1">PASS COMPLETION</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold font-[var(--font-space)] text-emerald-400">89%</span>
                    <span className="text-xs text-white/30">Target: 85%</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
