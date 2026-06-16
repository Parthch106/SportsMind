'use client';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  riskScore: number;
  recommendation: string;
  explanation: Array<{ feature: string; value: number; impact: string }>;
}

const RISK_CONFIG: Record<RiskLevel, {
  label: string;
  gradient: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}> = {
  LOW: {
    label: 'Low Risk',
    gradient: 'from-emerald-400 to-green-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/20',
    icon: '✓',
  },
  MEDIUM: {
    label: 'Medium Risk',
    gradient: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/20',
    icon: '⚠',
  },
  HIGH: {
    label: 'High Risk',
    gradient: 'from-red-400 to-rose-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/20',
    icon: '!',
  },
};

function RiskMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            pct < 40
              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
              : pct < 70
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-gradient-to-r from-red-500 to-rose-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-white/25 mt-1">
        <span>Safe</span><span>Danger</span>
      </div>
    </div>
  );
}

export default function RiskBadge({ riskLevel, riskScore, recommendation, explanation }: RiskBadgeProps) {
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.LOW;

  return (
    <div className={`relative rounded-2xl overflow-hidden border ${cfg.border} ${cfg.bg} p-5 shadow-xl ${cfg.glow}`}>
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg font-bold text-white text-sm`}>
            {cfg.icon}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Injury Risk</h3>
            <p className={`text-sm font-bold bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent`}>
              {cfg.label}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-white/80">{Math.round(riskScore * 100)}%</span>
      </div>

      <RiskMeter score={riskScore} />

      {/* Recommendation */}
      <p className="text-xs text-white/50 mt-3 leading-relaxed">{recommendation}</p>

      {/* Top 2 risk factors */}
      {explanation.slice(0, 2).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
          {explanation.slice(0, 2).map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-white/35 truncate mr-2">{e.feature}</span>
              <span className="text-white/50 font-medium whitespace-nowrap">{e.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
