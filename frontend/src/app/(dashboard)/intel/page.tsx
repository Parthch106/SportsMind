'use client';

import { useState, useEffect } from 'react';
import { Search, Cpu, Terminal, Database } from 'lucide-react';
import { analyseQuery } from '@/lib/api';
import NarrativePanel from '@/components/NarrativePanel';

export default function IntelPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [player, setPlayer] = useState('');
  const [time, setTime] = useState(0);

  // Fake logs for overstimulation
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        const fakeLogs = [
          '> CONNECTING TO QDRANT CLUSTER...',
          '> EXECUTING SEMANTIC SEARCH (all-MiniLM-L6-v2)',
          '> RETRIEVING HISTORICAL CONTEXT...',
          '> INJECTING XGBOOST PREDICTIONS...',
          '> AWAITING GPT-5 SYNTHESIS...',
          '> DECRYPTING RESPONSE...'
        ];
        setLogs(prev => [...prev, fakeLogs[Math.floor(Math.random() * fakeLogs.length)]].slice(-6));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    setAnalysis(null);
    setLogs(['> INITIALISING BRIEFING PROTOCOL...']);
    try {
      const res = await analyseQuery(query);
      setAnalysis(res.analysis);
      setPlayer(res.player_name);
      setTime(res.processing_time_ms);
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, '> ERROR: CONNECTION FAILED.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 pb-20 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-space)] text-violet-400 flex items-center gap-3">
            <Cpu className="w-8 h-8" />
            Intel & Briefings
          </h1>
          <p className="text-violet-500/50 text-sm mt-1 uppercase tracking-widest font-mono">
            SYS.MOD.04 // LLM Synthesis + RAG
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-96">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-violet-500/50" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Generate tactical briefing..."
            className="w-full bg-[#060d14] border border-violet-500/30 rounded-lg py-2 pl-10 pr-4 text-sm text-violet-400 placeholder:text-violet-500/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50 transition-all shadow-[0_0_15px_rgba(139,92,246,0.05)]"
          />
        </form>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Cyberpunk Terminal Logs */}
        <div className="shadow-[0_0_20px_rgba(139,92,246,0.05)] bg-[#03060a]/90 p-6 rounded-xl border border-violet-500/20 font-mono text-xs flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <div className="flex items-center gap-2 text-violet-500/60 mb-6 border-b border-violet-500/10 pb-4">
            <Terminal className="w-4 h-4" />
            <span>SYSTEM LOGS // CLUSTER ACTIVITY</span>
          </div>
          <div className="flex-1 space-y-2 text-violet-400/70">
            {logs.length === 0 && !analysis && (
               <p className="opacity-50">SYSTEM IDLE. AWAITING QUERY...</p>
            )}
            {logs.map((log, i) => (
              <p key={i} className="animate-in slide-in-from-top-2 duration-300">{log}</p>
            ))}
            {isLoading && (
              <p className="text-violet-400"><span className="typing-cursor"></span></p>
            )}
          </div>
        </div>

        {/* Right: Synthesis Output */}
        <div className="shadow-[0_0_20px_rgba(139,92,246,0.05)] bg-[#060d14]/80 p-6 rounded-xl border border-violet-500/20 relative">
          <div className="flex items-center gap-2 text-violet-500/60 mb-6 border-b border-violet-500/10 pb-4">
            <Database className="w-4 h-4" />
            <span className="font-mono text-xs">DECRYPTED BRIEFING</span>
          </div>
          
          {analysis ? (
             <NarrativePanel analysis={analysis} processingTimeMs={time} playerName={player} />
          ) : (
            <div className="h-64 flex items-center justify-center border border-dashed border-violet-500/20 rounded-lg">
               <p className="text-violet-500/30 text-xs font-mono">NO BRIEFING GENERATED</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
