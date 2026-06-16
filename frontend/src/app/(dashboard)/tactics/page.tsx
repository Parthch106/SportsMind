'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Navigation, Crosshair, Map } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import PitchHeatmap from '@/components/PitchHeatmap';
import LoadingPulse from '@/components/LoadingPulse';
import InsightCard from '@/components/InsightCard';

export default function TacticsPage() {
  const { data, isLoading } = useAnalysis();
  const tacticalData = data?.tactical;

  // Transform Radar Data
  const radarData = tacticalData?.tactical_fingerprint ? [
    { metric: 'High Press', value: tacticalData.tactical_fingerprint.HighPress, max: 100 },
    { metric: 'Counter Attack', value: tacticalData.tactical_fingerprint.CounterAttack, max: 100 },
    { metric: 'Width', value: tacticalData.tactical_fingerprint.Width, max: 100 },
    { metric: 'Direct Play', value: tacticalData.tactical_fingerprint.DirectPlay, max: 100 },
    { metric: 'Compactness', value: tacticalData.tactical_fingerprint.Compactness, max: 100 },
  ] : [];

  return (
    <div className="p-8 pb-20">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-space)] text-blue-500 flex items-center gap-3">
            <Navigation className="w-8 h-8" />
            Tactical Analysis
          </h1>
          <p className="text-blue-500/50 text-sm mt-1 uppercase tracking-widest font-mono">
            SYS.MOD.03 // K-Means Spatial Clustering
          </p>
        </div>
      </header>

      {isLoading && <LoadingPulse />}

      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 transition-opacity duration-500 ${isLoading ? 'opacity-0 hidden' : 'opacity-100'}`}>
        
        {/* Left Column: Heatmap */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <InsightCard 
            title="Tactical Vulnerability" 
            insight={data?.ai_insight_headline || "Tactical data is currently unavailable."} 
            color="blue" 
          />
          <div className="shadow-[0_0_20px_rgba(59,130,246,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-blue-500/20 relative overflow-hidden flex-1">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Map className="w-48 h-48 text-blue-500" />
             </div>
             {tacticalData ? (
               <PitchHeatmap
                 heatmapUrl={tacticalData.heatmap_url}
                 teamName={data?.player_name || tacticalData.team}
                 tacticalSummary={tacticalData.tactical_summary}
                 formationDetected={tacticalData.formation_detected}
                 vulnerabilityZones={tacticalData.vulnerability_zones}
               />
             ) : (
               <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-blue-500/20 rounded-lg">
                 <p className="text-blue-500/30 text-xs font-mono">MAP DATA UNAVAILABLE</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: Tactical Radar & Zone Bars */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Tactical Profile Radar */}
          <div className="shadow-[0_0_20px_rgba(59,130,246,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-blue-500/20 h-80 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-blue-500/60 mb-4 font-bold flex items-center gap-2">
              <Crosshair className="w-4 h-4" />
              {data?.player_name ? `${data.player_name}'s Tactical Fingerprint` : 'Team Tactical Fingerprint'}
            </h2>
            <div className="flex-1">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(59,130,246,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(59,130,246,0.5)', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={data?.player_name || "Profile"} dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#060d14', borderColor: 'rgba(59,130,246,0.3)', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-blue-500/20 rounded-lg">
                  <p className="text-blue-500/30 text-xs font-mono">NO PROFILE DATA</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Zone Bar Chart */}
          <div className="shadow-[0_0_20px_rgba(59,130,246,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-blue-500/20 flex-1 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-blue-500/60 mb-4 font-bold">
              Action Probability by Zone
            </h2>
            <div className="flex-1 min-h-[200px]">
              {tacticalData?.vulnerability_zones?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tacticalData.vulnerability_zones} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(59,130,246,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="zone" type="category" tick={{ fill: 'rgba(59,130,246,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      contentStyle={{ backgroundColor: '#060d14', borderColor: 'rgba(59,130,246,0.3)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="probability" name="Action Prob (%)" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-blue-500/20 rounded-lg">
                  <p className="text-blue-500/30 text-xs font-mono">NO VULNERABILITY DATA</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
