'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, ActivitySquare, AlertTriangle } from 'lucide-react';
import { useAnalysis } from '@/contexts/AnalysisContext';
import RiskBadge from '@/components/RiskBadge';
import LoadingPulse from '@/components/LoadingPulse';
import InsightCard from '@/components/InsightCard';

const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function InjuryPage() {
  const { data, isLoading } = useAnalysis();
  const injuryData = data?.injury;

  const getRiskColor = (level: string) => {
    if (level === 'LOW') return RISK_COLORS[0];
    if (level === 'MEDIUM') return RISK_COLORS[1];
    return RISK_COLORS[2];
  };

  const pieData = injuryData ? [
    { name: 'Risk', value: injuryData.risk_score * 100 },
    { name: 'Safe', value: 100 - (injuryData.risk_score * 100) }
  ] : [
    { name: 'Risk', value: 0 },
    { name: 'Safe', value: 100 }
  ];

  const workloadData = injuryData?.workload_timeline?.map(e => ({
    day: e.date,
    load: e.intensity_score,
    dangerThreshold: 85,
  })) || [];

  const scatterData = injuryData?.squad_scatter?.map(e => ({
    name: e.player_name,
    age: Math.round(e.age * 10) / 10,
    workloadIndex: Math.round((e.cumulative_minutes / 10) * 10) / 10, // Mock scaling
    riskLevel: e.risk_level,
    risk: e.risk_level === 'HIGH' ? 0.9 : e.risk_level === 'MEDIUM' ? 0.5 : 0.2
  })) || [];

  return (
    <div className="p-8 pb-20">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-space)] text-amber-500 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8" />
            Injury Risk Analysis
          </h1>
          <p className="text-amber-500/50 text-sm mt-1 uppercase tracking-widest font-mono">
            SYS.MOD.02 // XGBoost Classifier
          </p>
        </div>
      </header>

      {isLoading && <LoadingPulse />}

      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 transition-opacity duration-500 ${isLoading ? 'opacity-0 hidden' : 'opacity-100'}`}>
        
        {/* Left Column: Immediate Risk & Gauge */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <InsightCard 
            title="AI Risk Assessment" 
            insight={data?.ai_insight_headline || "Injury risk data is currently unavailable."} 
            color="amber" 
          />
          <div className="shadow-[0_0_20px_rgba(245,158,11,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-amber-500/20 relative overflow-hidden">
             <h2 className="text-xs uppercase tracking-widest text-amber-500/60 mb-4 font-bold">Current Assessment</h2>
             {injuryData ? (
               <RiskBadge 
                 riskLevel={injuryData.risk_level} 
                 riskScore={injuryData.risk_score} 
                 recommendation={injuryData.recommendation} 
                 explanation={injuryData.shap_explanation} 
               />
             ) : (
               <div className="h-40 flex items-center justify-center border border-dashed border-amber-500/20 rounded-lg">
                 <p className="text-amber-500/30 text-xs font-mono">NO DATA LOADED</p>
               </div>
             )}
          </div>

          {/* Risk Probability Gauge (Donut) */}
          <div className="shadow-[0_0_20px_rgba(245,158,11,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-amber-500/20 flex-1 flex flex-col items-center justify-center relative">
             <h2 className="absolute top-6 left-6 text-xs uppercase tracking-widest text-amber-500/60 font-bold">Risk Probability</h2>
             <div className="w-48 h-48 mt-4 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     startAngle={180}
                     endAngle={0}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     <Cell fill={injuryData ? getRiskColor(injuryData.risk_level) : '#1e293b'} />
                     <Cell fill="rgba(255,255,255,0.05)" />
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                 <span className="text-3xl font-bold font-[var(--font-space)] text-white">
                   {injuryData ? Math.round(injuryData.risk_score * 100) : '--'}%
                 </span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Workload Timeline & Scatter */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Workload Area Chart */}
          <div className="shadow-[0_0_20px_rgba(245,158,11,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-amber-500/20 h-72 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-amber-500/60 mb-4 font-bold flex items-center gap-2">
              <ActivitySquare className="w-4 h-4" />
              30-Day Physical Workload Tracker
            </h2>
            <div className="flex-1">
              {workloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workloadData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDanger" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.1)" vertical={false} />
                    <XAxis dataKey="day" tick={false} axisLine={{ stroke: 'rgba(245,158,11,0.2)' }} />
                    <YAxis tick={{ fill: 'rgba(245,158,11,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#060d14', borderColor: 'rgba(245,158,11,0.3)', borderRadius: '8px' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="dangerThreshold" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" fill="url(#colorDanger)" name="Danger Zone" />
                    <Area type="monotone" dataKey="load" stroke="#f59e0b" strokeWidth={2} fill="url(#colorLoad)" name="Load Index" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#060d14' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-amber-500/20 rounded-lg">
                  <p className="text-amber-500/30 text-xs font-mono">NO WORKLOAD DATA</p>
                </div>
              )}
            </div>
          </div>

          {/* Age vs Workload Scatter */}
          <div className="shadow-[0_0_20px_rgba(245,158,11,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-amber-500/20 flex-1 flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-amber-500/60 mb-2 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Squad Risk Clustering (Age vs Workload)
            </h2>
            <div className="flex-1 min-h-[200px] mt-2">
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.05)" />
                    <XAxis type="number" dataKey="age" name="Age" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'rgba(245,158,11,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(245,158,11,0.2)' }} />
                    <YAxis type="number" dataKey="workloadIndex" name="Workload" tick={{ fill: 'rgba(245,158,11,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ZAxis type="number" dataKey="risk" range={[20, 100]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#060d14] border border-amber-500/30 p-3 rounded-lg shadow-xl min-w-[120px]">
                              <p className="text-amber-500 font-bold text-sm mb-1">{data.name}</p>
                              <p className="text-white/80 text-xs">Age: <span className="text-white font-medium">{data.age}</span></p>
                              <p className="text-white/80 text-xs">Workload: <span className="text-white font-medium">{data.workloadIndex}</span></p>
                              <p className="text-white/80 text-xs mt-1 pt-1 border-t border-white/10">
                                Risk: <span className={`font-bold ${data.riskLevel === 'HIGH' ? 'text-red-400' : data.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{data.riskLevel}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Players" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.riskLevel === 'HIGH' ? '#ef4444' : entry.riskLevel === 'MEDIUM' ? '#f59e0b' : '#10b981'} fillOpacity={0.6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-amber-500/20 rounded-lg">
                  <p className="text-amber-500/30 text-xs font-mono">NO SQUAD DATA</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
