import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InsightCardProps {
  title: string;
  insight: string;
  color?: 'emerald' | 'amber' | 'blue' | 'violet';
}

export default function InsightCard({ title, insight, color = 'emerald' }: InsightCardProps) {
  const colorMap = {
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    violet: 'text-violet-400 border-violet-500/30 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]',
  };

  const iconColorMap = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    violet: 'text-violet-500',
  };

  return (
    <div className={`p-4 rounded-xl border relative overflow-hidden backdrop-blur-sm ${colorMap[color]} animate-in fade-in slide-in-from-bottom-2 duration-700`}>
      <div className="flex items-start gap-3 relative z-10">
        <div className={`mt-0.5 ${iconColorMap[color]}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-1 opacity-60 ${colorMap[color].split(' ')[0]}`}>
            {title}
          </h3>
          <div className="text-sm font-medium leading-relaxed text-white/90 font-sans [&>p>strong]:text-amber-300">
            <ReactMarkdown components={{
              strong: ({node, ...props}) => <strong className="font-bold text-white/100 drop-shadow-md" {...props} />
            }}>
              {insight}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      {/* Background sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[scan_3s_ease-in-out_infinite]" />
    </div>
  );
}
