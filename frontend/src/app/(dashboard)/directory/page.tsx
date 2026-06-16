'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { analyseQuery } from '@/lib/api';
import { Search, Trophy, Shield, User, ChevronRight } from 'lucide-react';
import directoryData from '@/data/directory.json';

type Player = string;
type Team = { name: string; players: Player[] };
type League = { name: string; teams: Team[] };

const leagues: League[] = directoryData as League[];

export default function DirectoryPage() {
  const router = useRouter();
  const { setData, setIsLoading } = useAnalysis();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueIndex, setSelectedLeagueIndex] = useState<number>(0);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);

  // Flatten for search
  const allPlayers = leagues.flatMap(l => 
    l.teams.flatMap(t => 
      t.players.map(p => ({ player: p, team: t.name, league: l.name }))
    )
  );

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : allPlayers.filter(p => 
        p.player.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.team.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 50);

  const handleSelectPlayer = async (playerName: string) => {
    try {
      setIsLoading(true);
      const response = await analyseQuery(`Show me the profile for ${playerName}`, undefined, playerName);
      setData(response);
      router.push('/performance');
    } catch (err) {
      console.error('Failed to load player:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLeague = leagues[selectedLeagueIndex];
  const selectedTeam = selectedTeamIndex !== null ? selectedLeague.teams[selectedTeamIndex] : null;

  return (
    <div className="p-8 w-full h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-[var(--font-space)] text-white">Player Directory</h1>
            <p className="text-emerald-500/60 font-mono text-sm">Browse 2000+ active profiles across {leagues.length} competitions</p>
          </div>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input 
            type="text"
            placeholder="Search players or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060d14]/80 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {searchQuery.trim() !== '' ? (
        <div className="flex-1 bg-[#060d14]/80 border border-white/10 rounded-2xl p-6 overflow-y-auto custom-scrollbar">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Search Results ({searchResults.length})</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
            {searchResults.map((res, i) => (
              <button 
                key={i}
                onClick={() => handleSelectPlayer(res.player)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-[#03060a] border border-white/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-white font-medium truncate">{res.player}</p>
                  <p className="text-[10px] text-white/40 uppercase truncate">{res.team} • {res.league}</p>
                </div>
              </button>
            ))}
          </div>
          {searchResults.length === 0 && <p className="text-white/40 text-center py-8">No players found.</p>}
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden h-full pb-8">
          {/* Column 1: Leagues */}
          <div className="w-1/3 flex flex-col bg-[#060d14]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 shrink-0 bg-[#03060a]/80">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Competitions</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {leagues.map((league, i) => {
                const isSelected = selectedLeagueIndex === i;
                return (
                  <button
                    key={league.name}
                    onClick={() => {
                      setSelectedLeagueIndex(i);
                      setSelectedTeamIndex(null);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-emerald-500/40'}`} />
                      <span className={`font-medium font-[var(--font-space)] ${isSelected ? 'text-emerald-400' : 'text-white/80'}`}>
                        {league.name}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-white/20'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Teams */}
          <div className="w-1/3 flex flex-col bg-[#060d14]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 shrink-0 bg-[#03060a]/80 flex justify-between items-center">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Teams</h2>
              <span className="text-[10px] text-emerald-500/50 font-mono">{selectedLeague?.teams.length} total</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {selectedLeague?.teams.map((team, i) => {
                const isSelected = selectedTeamIndex === i;
                return (
                  <button
                    key={team.name}
                    onClick={() => setSelectedTeamIndex(i)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Shield className={`shrink-0 w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-white/20'}`} />
                      <span className={`truncate font-medium text-sm ${isSelected ? 'text-emerald-100' : 'text-white/70'}`}>
                        {team.name}
                      </span>
                    </div>
                    <ChevronRight className={`shrink-0 w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-white/20'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Players */}
          <div className="w-1/3 flex flex-col bg-[#060d14]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl relative">
            <div className="p-4 border-b border-white/10 shrink-0 bg-[#03060a]/80 flex justify-between items-center">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Roster</h2>
              <span className="text-[10px] text-emerald-500/50 font-mono">{selectedTeam?.players.length || 0} players</span>
            </div>
            
            {selectedTeam ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {selectedTeam.players.map((player) => (
                  <button
                    key={player}
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-500/10 text-left group transition-all border border-transparent hover:border-emerald-500/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                      <User className="shrink-0 w-4 h-4 text-emerald-500/40 group-hover:text-emerald-400" />
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-emerald-100 truncate font-medium">{player}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/20 text-sm font-mono uppercase tracking-widest bg-black/20 px-4 py-2 rounded-lg border border-white/5">Select a team</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
