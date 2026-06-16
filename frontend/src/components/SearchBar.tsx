'use client';

import { useState, useRef } from 'react';

const EXAMPLE_QUERIES = [
  'How will Lamine Yamal perform vs PSG?',
  'Is Rodri at high injury risk this week?',
  'What tactical weakness does Arsenal expose?',
  'How will Messi perform against Real Madrid?',
];

interface SearchBarProps {
  onSearch: (query: string, player: string, opponent: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [player, setPlayer] = useState('');
  const [opponent, setOpponent] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), player.trim(), opponent.trim());
    setShowExamples(false);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Main search input */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden focus-within:border-emerald-400/50 transition-all duration-300 shadow-2xl">
          {/* Search icon */}
          <div className="flex-shrink-0 pl-5 pr-3">
            <svg className="w-5 h-5 text-white/40 group-focus-within:text-emerald-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            id="main-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 200)}
            placeholder='Ask SportsMind anything… e.g. "How will Lamine Yamal perform vs PSG?"'
            className="flex-1 bg-transparent py-5 pr-4 text-white placeholder-white/30 text-base focus:outline-none"
            disabled={isLoading}
          />
          {/* Submit button */}
          <div className="flex-shrink-0 pr-3">
            <button
              id="search-btn"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  Analyse
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example query dropdown */}
        {showExamples && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f1823]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 text-xs text-white/30 font-medium uppercase tracking-wider border-b border-white/5">
              Try these queries
            </div>
            {EXAMPLE_QUERIES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleExampleClick(ex)}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <span className="text-emerald-400/60">⚽</span>
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Optional fields */}
      <div className="flex gap-3 mt-3">
        <input
          id="player-input"
          type="text"
          value={player}
          onChange={(e) => setPlayer(e.target.value)}
          placeholder="Player name (optional)"
          className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/40 transition-colors"
          disabled={isLoading}
        />
        <input
          id="opponent-input"
          type="text"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Opponent team (optional)"
          className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/40 transition-colors"
          disabled={isLoading}
        />
      </div>
    </form>
  );
}
