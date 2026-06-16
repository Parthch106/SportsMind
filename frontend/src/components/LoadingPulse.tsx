'use client';

export default function LoadingPulse() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Narrative panel skeleton */}
      <div className="rounded-2xl bg-white/5 border border-white/8 p-6 h-40">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div>
            <div className="h-3 w-24 bg-white/10 rounded mb-1" />
            <div className="h-2 w-16 bg-white/6 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-white/8 rounded w-full" />
          <div className="h-3 bg-white/8 rounded w-5/6" />
          <div className="h-3 bg-white/8 rounded w-4/6" />
        </div>
      </div>

      {/* Cards row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/8 p-5 h-36">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/10" />
              <div className="h-2 w-20 bg-white/8 rounded" />
            </div>
            <div className="h-8 w-16 bg-white/10 rounded mb-2" />
            <div className="h-1.5 bg-white/8 rounded-full w-full" />
          </div>
        ))}
      </div>

      {/* SHAP + heatmap skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/8 p-5 h-52" />
        <div className="rounded-2xl bg-white/5 border border-white/8 p-5 h-52" />
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-sm text-white/30 animate-pulse">
          Running ML models, retrieving historical context…
        </p>
      </div>
    </div>
  );
}
