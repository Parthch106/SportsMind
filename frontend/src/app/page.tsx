'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, Activity, Navigation, Radio, Terminal, ChevronRight, BarChart3, Fingerprint } from 'lucide-react';
import DecryptedText from '@/components/reactbits/DecryptedText';
import BorderGlow from '@/components/reactbits/BorderGlow';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#060d14]">
      
      {/* --- VIDEO BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
        >
          {/* Abstract high-tech data loop from public CDN */}
          <source src="https://cdn.coverr.co/videos/coverr-abstract-neon-lines-loop-3037/1080p.mp4" type="video/mp4" />
        </video>
        {/* Gradients to fade out the video edges and ensure text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d14]/50 via-[#060d14]/80 to-[#060d14]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#060d14_80%)]" />
      </div>

      {/* --- HERO SECTION --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-center max-w-5xl mx-auto px-6 z-10 pt-32 lg:pt-48 pb-20"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-bold">GPT-5 Intelligence Layer Active</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold font-[var(--font-space)] tracking-tighter mb-8 leading-[0.9]">
          <DecryptedText text="SPORTSMIND" speed={60} maxIterations={12} />
        </h1>
        
        <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          The elite football telemetry platform. We fuse XGBoost predictions, spatial clustering, and real-time GPT-5 synthesis into one <span className="text-white font-bold">overstimulating dashboard</span>.
        </p>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-white text-[#060d14] px-10 py-5 rounded-full font-bold tracking-widest text-sm hover:bg-emerald-400 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] group uppercase"
          >
            Deploy Command Center
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>

      {/* --- INFINITE TICKER --- */}
      <div className="w-full relative z-10 border-y border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden py-4 flex">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-16 font-mono text-sm text-emerald-500/60 uppercase tracking-widest min-w-full">
           <span className="flex items-center gap-3"><Activity className="w-4 h-4"/> 4.2M Matches Simulated</span>
           <span className="flex items-center gap-3"><Radio className="w-4 h-4 text-rose-500"/> Live Telemetry Active</span>
           <span className="flex items-center gap-3"><BarChart3 className="w-4 h-4"/> XGBoost Regressor Loaded</span>
           <span className="flex items-center gap-3"><Fingerprint className="w-4 h-4"/> SHAP Explainability Engine</span>
           <span className="flex items-center gap-3"><Activity className="w-4 h-4"/> 4.2M Matches Simulated</span>
           <span className="flex items-center gap-3"><Radio className="w-4 h-4 text-rose-500"/> Live Telemetry Active</span>
           <span className="flex items-center gap-3"><BarChart3 className="w-4 h-4"/> XGBoost Regressor Loaded</span>
           <span className="flex items-center gap-3"><Fingerprint className="w-4 h-4"/> SHAP Explainability Engine</span>
        </div>
      </div>

      {/* --- BENTO GRID FEATURE SHOWCASE --- */}
      <div className="max-w-7xl mx-auto px-6 py-32 z-10 w-full">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-[var(--font-space)] mb-4">Neural Architecture</h2>
          <p className="text-white/50 font-mono text-sm">SYS.MOD.OVERVIEW // FOUR CORE ML PILLARS</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]"
        >
          {/* BENTO ITEM: Live Match Center */}
          <BorderGlow 
            className="md:col-span-2 md:row-span-2 rounded-3xl bg-[#0a1219]" 
            glowColor="rgba(244, 63, 94, 0.5)" // rose-500
          >
            <div className="h-full w-full bg-gradient-to-br from-rose-500/10 to-transparent p-8 flex flex-col relative overflow-hidden group rounded-3xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute top-0 right-0 p-8">
                <Radio className="w-12 h-12 text-rose-500 animate-pulse opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-auto relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Real-Time
                </div>
                <h3 className="text-4xl font-bold font-[var(--font-space)] text-white mb-4">Live Match Simulation</h3>
                <p className="text-lg text-white/60 leading-relaxed max-w-md">
                  Stream simulated live events, ticking match clocks, and dynamic momentum gauges directly alongside GPT-5 powered live tactical commentary.
                </p>
              </div>
              {/* Fake UI Element inside Bento */}
              <div className="absolute right-[-10%] bottom-[-10%] w-[60%] h-[60%] bg-[#060d14] rounded-tl-xl border-t border-l border-rose-500/30 p-6 shadow-2xl rotate-[-5deg] group-hover:rotate-0 group-hover:translate-y-[-10px] group-hover:translate-x-[-10px] transition-all duration-500 hidden lg:block">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                  <div className="h-4 w-5/6 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </BorderGlow>

          {/* BENTO ITEM: Performance Predictor */}
          <BorderGlow className="rounded-3xl bg-[#0a1219]">
            <div className="h-full w-full bg-gradient-to-br from-emerald-500/10 to-transparent p-8 flex flex-col justify-end group rounded-3xl">
              <Activity className="w-10 h-10 text-emerald-500 mb-6 group-hover:scale-110 transition-transform origin-left" />
              <h3 className="text-2xl font-bold font-[var(--font-space)] text-white mb-2">Performance Predicter</h3>
              <p className="text-white/60 text-sm leading-relaxed">XGBoost regression forecasting xG and Key Passes based on historical SHAP drivers.</p>
            </div>
          </BorderGlow>

          {/* BENTO ITEM: Injury Risk */}
          <BorderGlow className="rounded-3xl bg-[#0a1219]" glowColor="rgba(245, 158, 11, 0.5)">
            <div className="h-full w-full bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col justify-end group rounded-3xl">
              <ShieldAlert className="w-10 h-10 text-amber-500 mb-6 group-hover:scale-110 transition-transform origin-left" />
              <h3 className="text-2xl font-bold font-[var(--font-space)] text-white mb-2">Injury Risk Analyzer</h3>
              <p className="text-white/60 text-sm leading-relaxed">ML classification models tracking rolling 30-day workloads to prevent catastrophic failure.</p>
            </div>
          </BorderGlow>

          {/* BENTO ITEM: Tactical Heatmaps */}
          <BorderGlow className="md:col-span-3 rounded-3xl bg-[#0a1219]" glowColor="rgba(59, 130, 246, 0.5)">
            <div className="h-full w-full bg-gradient-to-br from-blue-500/10 to-transparent p-8 flex flex-col md:flex-row items-center gap-8 group rounded-3xl">
              <div className="flex-1">
                <Navigation className="w-10 h-10 text-blue-500 mb-6 group-hover:translate-x-2 transition-transform" />
                <h3 className="text-2xl font-bold font-[var(--font-space)] text-white mb-2">K-Means Tactical Clustering</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                  We utilize K-Means spatial clustering algorithms on pitch coordinates to automatically detect formation weaknesses and plot overstimulating, high-contrast tactical heatmaps.
                </p>
              </div>
              {/* Fake Heatmap Element */}
              <div className="w-full md:w-64 h-32 rounded-xl bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-rose-500/20 border border-white/10 blur-[2px] group-hover:blur-none transition-all duration-500" />
            </div>
          </BorderGlow>
        </motion.div>
      </div>

      {/* --- AI CO-PILOT BANNER --- */}
      <div className="w-full border-t border-emerald-500/20 bg-emerald-500/5 py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Terminal className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold font-[var(--font-space)] mb-4">Universal AI Co-pilot</h2>
          <p className="text-white/50 leading-relaxed mb-8">
            Data means nothing without interpretation. Our globally persistent GPT-5 Co-pilot translates every complex ML chart into plain English instantly. Just click the glowing chat bubble in the command center.
          </p>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-400 font-mono text-sm hover:text-emerald-300 transition-colors group"
          >
            INITIALIZE SYSTEM <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
    </div>
  );
}
