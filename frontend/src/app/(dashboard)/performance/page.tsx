'use client';

import { Activity, Target, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalysis } from '@/contexts/AnalysisContext';
import ShapChart from '@/components/ShapChart';
import StatCard from '@/components/StatCard';
import LoadingPulse from '@/components/LoadingPulse';
import InsightCard from '@/components/InsightCard';
import RawDataTable from '@/components/RawDataTable';

export default function PerformancePage() {
  const { data, isLoading } = useAnalysis();
  const perfData = data?.performance;

  // Transform Profile Radar Data
  const radarData = perfData?.profile_radar ? [
    { subject: 'xG', A: perfData.profile_radar.xg.player_value, B: perfData.profile_radar.xg.positional_average, fullMark: 1.0 },
    { subject: 'xA', A: perfData.profile_radar.xa.player_value, B: perfData.profile_radar.xa.positional_average, fullMark: 1.0 },
    { subject: 'Key Passes', A: perfData.profile_radar.key_passes.player_value, B: perfData.profile_radar.key_passes.positional_average, fullMark: 5.0 },
    { subject: 'Prog Runs', A: perfData.profile_radar.progressive_runs.player_value, B: perfData.profile_radar.progressive_runs.positional_average, fullMark: 8.0 },
    { subject: 'Dribbles', A: perfData.profile_radar.dribbles.player_value, B: perfData.profile_radar.dribbles.positional_average, fullMark: 6.0 },
    { subject: 'Shots', A: perfData.profile_radar.shots.player_value, B: perfData.profile_radar.shots.positional_average, fullMark: 4.0 },
  ] : [];

  // Transform Timeline Data
  const timelineData = perfData?.form_timeline?.map(e => ({
    match: e.opponent_abbr,
    xG: e.actual_xg,
    kP: e.actual_key_passes,
    isPrediction: e.is_prediction
  })) || [];

  return (
    <div className="p-8 pb-20">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-space)] text-emerald-400 flex items-center gap-3">
            <Activity className="w-8 h-8" />
            Performance Metrics
          </h1>
          <p className="text-emerald-500/50 text-sm mt-1 uppercase tracking-widest font-mono">
            SYS.MOD.01 // XGBoost Regressor
          </p>
        </div>
      </header>

      {isLoading && <LoadingPulse />}

      {/* Default State or Results */}
      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 transition-opacity duration-500 ${isLoading ? 'opacity-0 hidden' : 'opacity-100'}`}>
        
        {/* Left Column: Primary Metrics & Radar */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <InsightCard 
            title="AI Insight" 
            insight={data?.ai_insight_headline || "Performance prediction data is currently unavailable for this player."} 
            color="emerald" 
          />
          {/* Main Stat Card */}
          <div className="panel-glow bg-[#060d14]/80 p-6 rounded-xl border border-emerald-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-24 h-24 text-emerald-500" />
             </div>
             <h2 className="text-xs uppercase tracking-widest text-emerald-500/60 mb-4 font-bold">Predicted Impact</h2>
             {perfData ? (
               <StatCard 
                 metrics={perfData.dynamic_metrics || []} 
                 confidence={perfData.confidence} 
                 opponent={perfData.opponent} 
               />
             ) : (
               <div className="space-y-4">
                 <div>
                   <p className="text-[10px] text-emerald-500/40 font-mono">EXPECTED GOALS (xG)</p>
                   <p className="text-4xl font-bold text-emerald-400/20 font-[var(--font-space)]">--</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-emerald-500/40 font-mono">EXPECTED ASSISTS (xA)</p>
                   <p className="text-4xl font-bold text-emerald-400/20 font-[var(--font-space)]">--</p>
                 </div>
               </div>
             )}
          </div>

          {/* Radar Chart */}
          <div className="panel-glow bg-[#060d14]/80 p-6 rounded-xl border border-emerald-500/20 flex-1 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500/60 mb-2 font-bold flex justify-between">
              <span>Profile Analysis</span>
              <span className="text-[10px] text-emerald-400/40">Player (A) vs Pos Avg (B)</span>
            </h2>
            <div className="flex-1 min-h-[250px]">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(16,185,129,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(16,185,129,0.5)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                    <Radar name="Player" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Radar name="Pos Avg" dataKey="B" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#060d14', borderColor: 'rgba(16,185,129,0.3)', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981', fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-500/30 text-xs font-mono">NO PROFILE DATA</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & SHAP */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Timeline Line Chart */}
          <div className="panel-glow bg-[#060d14]/80 p-6 rounded-xl border border-emerald-500/20 h-72 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-emerald-500/60 mb-4 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Form Timeline (Last 5 + Prediction)
            </h2>
            <div className="flex-1">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" vertical={false} />
                    <XAxis dataKey="match" tick={{ fill: 'rgba(16,185,129,0.5)', fontSize: 10 }} axisLine={{ stroke: 'rgba(16,185,129,0.2)' }} />
                    <YAxis yAxisId="left" tick={{ fill: 'rgba(16,185,129,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(6,182,212,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#060d14', borderColor: 'rgba(16,185,129,0.3)', borderRadius: '8px' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="xG" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#06b6d4' }} />
                    <Line yAxisId="right" type="monotone" dataKey="kP" name="Key Passes" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#06b6d4', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-500/30 text-xs font-mono">NO TIMELINE DATA</p>
                </div>
              )}
            </div>
          </div>

          {/* SHAP Feature Importance */}
          <div className="panel-glow bg-[#060d14]/80 p-6 rounded-xl border border-emerald-500/20 flex-1">
            {perfData?.shap_top_drivers ? (
               <ShapChart drivers={perfData.shap_top_drivers} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-emerald-500/20">
                <Activity className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm font-mono uppercase tracking-widest">Awaiting Analysis Data</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Raw Data Table */}
      {perfData?.raw_matches && (
        <RawDataTable matches={perfData.raw_matches} />
      )}
    </div>
  );
}
