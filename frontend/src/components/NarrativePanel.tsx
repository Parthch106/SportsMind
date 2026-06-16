'use client';

import { useEffect, useRef } from 'react';

interface NarrativePanelProps {
  analysis: string;
  processingTimeMs: number;
  playerName: string;
}

export default function NarrativePanel({ analysis, processingTimeMs, playerName }: NarrativePanelProps) {
  const textRef = useRef<HTMLParagraphElement>(null);

  // Animated text reveal on mount
  useEffect(() => {
    if (!textRef.current) return;
    const el = textRef.current;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, [analysis]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 shadow-xl">
      {/* Gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">SportsMind Analysis</h2>
            {playerName && (
              <p className="text-xs text-white/40">About {playerName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {processingTimeMs > 0 && <span>{(processingTimeMs / 1000).toFixed(1)}s</span>}
          <span className="ml-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI Generated
          </span>
        </div>
      </div>

      {/* Analysis text */}
      <p
        ref={textRef}
        className="text-white/80 leading-relaxed text-[0.95rem] tracking-wide"
      >
        {analysis}
      </p>

      {/* Bottom note */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-white/25">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        Powered by XGBoost · SHAP · Qdrant RAG · GPT-5 (GitHub Models) · StatsBomb data
      </div>
    </div>
  );
}
