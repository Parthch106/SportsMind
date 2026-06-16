'use client';

import { Bot, Activity, ShieldAlert, Navigation, Radio, Info } from 'lucide-react';
import BorderGlow from '@/components/reactbits/BorderGlow';

export default function GuidePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-bold font-[var(--font-space)] text-white mb-2">System Manual</h1>
        <p className="text-emerald-500/50 uppercase tracking-[0.2em] font-mono text-sm">
          SPORTSMIND V1.0 // OFFICAL DOCUMENTATION
        </p>
      </div>

      <div className="space-y-12">
        {/* AI Copilot Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Bot className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold font-[var(--font-space)]">AI Co-Pilot Interaction Guide</h2>
          </div>
          <BorderGlow className="rounded-2xl" glowColor="rgba(16, 185, 129, 0.3)">
            <div className="bg-[#0a1219] p-8 rounded-2xl border border-white/5">
              <p className="text-white/70 leading-relaxed mb-6">
                The AI Co-Pilot is a persistently connected intelligence layer powered by GPT-5 and Qdrant RAG. It has direct access to all telemetry, ML models, and historical data within the current match context.
              </p>
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500/80 mb-4">What to ask the AI:</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-emerald-400 font-mono shrink-0">01</span>
                  <div>
                    <p className="font-bold text-white mb-1">"How will Lamine Yamal perform vs PSG?"</p>
                    <p className="text-sm text-white/50">The AI will predict xG and key passes, then break down the SHAP drivers (e.g., PSG's high defensive line, Yamal's form) while retrieving historical context from his last 4 appearances against French clubs.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-emerald-400 font-mono shrink-0">02</span>
                  <div>
                    <p className="font-bold text-white mb-1">"Is Rodri at high injury risk given the last 3 weeks?"</p>
                    <p className="text-sm text-white/50">It will analyze his recent minutes played, high-intensity actions, and rest days, using an XGBoost classifier to flag potential soft tissue injury risks.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="text-emerald-400 font-mono shrink-0">03</span>
                  <div>
                    <p className="font-bold text-white mb-1">"What tactical weakness does Arsenal expose against a high press?"</p>
                    <p className="text-sm text-white/50">It translates raw spatial coordinate clusters from K-Means into plain English tactical setups, highlighting zone vulnerabilities and passing networks.</p>
                  </div>
                </li>
              </ul>
            </div>
          </BorderGlow>
        </section>

        {/* Modules Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold font-[var(--font-space)]">Module & Chart Explanations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Match Center */}
            <div className="bg-[#0a1219] p-6 rounded-2xl border border-rose-500/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-rose-500/5 group-hover:text-rose-500/10 transition-colors">
                <Radio className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Live Match Center
              </h3>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                Aggregates raw telemetry data into a live feed. 
              </p>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <strong className="text-rose-400 block mb-1 text-sm">Momentum Gauges</strong>
                <p className="text-xs text-white/50">Measured by analyzing ball possession zones, successful passes in the final third, and high-intensity presses per minute. Higher gauges equal sustained attacking pressure.</p>
              </div>
            </div>

            {/* Performance Predictor */}
            <div className="bg-[#0a1219] p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                <Activity className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Performance Predictor
              </h3>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                Uses an XGBoost Regression model to forecast xG (Expected Goals) and xA (Expected Assists).
              </p>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <strong className="text-emerald-400 block mb-1 text-sm">SHAP Charts</strong>
                <p className="text-xs text-white/50">SHAP (SHapley Additive exPlanations) breaks down ML predictions. Red bars mean a feature (like player pace) increased the xG prediction. Blue bars mean a feature decreased it. It answers *why* the model made a decision.</p>
              </div>
            </div>

            {/* Injury Risk */}
            <div className="bg-[#0a1219] p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-amber-500/5 group-hover:text-amber-500/10 transition-colors">
                <ShieldAlert className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Injury Risk Analyzer
              </h3>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                ML classification model identifying the probability of non-contact soft tissue injuries.
              </p>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <strong className="text-amber-400 block mb-1 text-sm">ACWR & Risk Badge</strong>
                <p className="text-xs text-white/50">Acute:Chronic Workload Ratio compares the last 7 days of sprint volume (Acute) against the rolling 28-day average (Chronic). A ratio between 0.8 and 1.3 is the "sweet spot". &gt;1.5 triggers the Critical Risk Badge.</p>
              </div>
            </div>

            {/* Tactics */}
            <div className="bg-[#0a1219] p-6 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
                <Navigation className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-500" /> Tactical Analysis
              </h3>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">
                Automated formation detection using unsupervised machine learning.
              </p>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <strong className="text-blue-400 block mb-1 text-sm">Pitch Heatmap (K-Means)</strong>
                <p className="text-xs text-white/50">K-Means clustering groups thousands of XY pitch coordinates. The resulting "centroids" (center points of the clusters) represent the average position of players, automatically exposing the true tactical shape regardless of the nominal formation.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
