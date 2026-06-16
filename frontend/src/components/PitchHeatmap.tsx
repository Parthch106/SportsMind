'use client';

import Image from 'next/image';


interface PitchHeatmapProps {
  heatmapUrl: string;
  teamName: string;
  tacticalSummary: string;
  formationDetected: string;
  vulnerabilityZones: Array<{
    zone: string;
    concession_rate: number;
    goals_conceded: number;
    avg_xg_against: number;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PitchHeatmap({
  heatmapUrl,
  teamName,
  tacticalSummary,
  formationDetected,
  vulnerabilityZones,
}: PitchHeatmapProps) {
  const fullUrl = heatmapUrl ? `${API_URL}${heatmapUrl}` : '';

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 shadow-xl">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Tactical Heatmap</h3>
            <p className="text-sm font-medium text-white/80">{teamName} — Action Zones</p>
          </div>
        </div>
        {formationDetected && formationDetected !== 'Unknown' && (
          <span className="text-xs font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white/50">
            {formationDetected}
          </span>
        )}
      </div>

      {/* Heatmap image */}
      {fullUrl ? (
        <div className="relative w-full h-auto aspect-[105/68]">
          <Image 
            src={fullUrl} 
            alt="Tactical Pitch Heatmap" 
            fill
            className="object-contain filter hue-rotate-180 brightness-150 contrast-125"
          />
        </div>
      ) : (
        // Placeholder pitch SVG when no heatmap is available
        <div className="rounded-xl overflow-hidden aspect-[10/7] bg-gradient-to-br from-[#1a2e1a] to-[#0d1b0d] border border-white/5 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">⚽</div>
            <p className="text-xs text-white/20">
              {fullUrl ? 'Heatmap loading...' : 'Run tactical analysis to generate heatmap'}
            </p>
          </div>
        </div>
      )}

      {/* Vulnerability zones */}
      {vulnerabilityZones.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Vulnerability Zones</p>
          {vulnerabilityZones.slice(0, 3).map((zone, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 text-xs text-white/40 truncate capitalize">{zone.zone}</div>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-1000"
                  style={{ width: `${zone.concession_rate * 100}%` }}
                />
              </div>
              <div className="text-xs text-white/50 w-8 text-right">{Math.round(zone.concession_rate * 100)}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {tacticalSummary && (
        <p className="mt-3 text-xs text-white/35 leading-relaxed">{tacticalSummary}</p>
      )}
    </div>
  );
}
