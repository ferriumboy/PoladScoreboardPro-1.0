
import React, { useState, useMemo } from 'react';
import { Match, Team, MatchStats, TournamentType } from '../types';
import MatchStatsOverlay from './MatchStatsOverlay';
import BracketView from './BracketView';

interface Props {
  matches: Match[];
  teams: Team[];
  teamPlayers: Record<string, string[]>;
  onUpdateScore: (id: string, updates: Partial<Match>) => void;
  onStartInterview: (match: Match) => void;
  type?: TournamentType;
  onMatchClick?: (id: string) => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const Fixtures: React.FC<Props> = ({ matches, teams, teamPlayers, onUpdateScore, onStartInterview, type, onMatchClick }) => {
  const [viewMode, setViewMode] = useState<'groups' | 'bracket'>('groups');

  const getTeam = (id: string) => (teams || []).find(t => t.id === id);

  const groupMatches = matches.filter(m => !m.isKnockout);
  const knockoutMatches = matches.filter(m => m.isKnockout);

  const rounds: Record<number, Match[]> = {};
  groupMatches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const knockoutRounds: Record<string, Match[]> = {};
  knockoutMatches.forEach(m => {
    const stage = m.stageName || 'Pley-off';
    // Remove (1-ci Oyun) / (2-ci Oyun) for grouping
    const baseStage = stage.replace(/ \(.*?\)/, '');
    if (!knockoutRounds[baseStage]) knockoutRounds[baseStage] = [];
    knockoutRounds[baseStage].push(m);
  });

  const sortedRoundNumbers = Object.keys(rounds || {}).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6 md:space-y-10 max-h-[600px] md:max-h-[850px] overflow-y-auto custom-scrollbar pr-1 md:pr-3 pb-10">
      {knockoutMatches.length > 0 && groupMatches.length > 0 && (
        <div className="hidden">
        </div>
      )}

      {(viewMode === 'groups' || groupMatches.length === 0) && sortedRoundNumbers.map(roundNum => (
        <div key={roundNum} className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-neon font-black text-[10px] md:text-xs uppercase tracking-[0.3em]">
              {rounds[roundNum][0]?.stageName && rounds[roundNum][0].stageName !== 'Liqa Mərhələsi' 
                ? rounds[roundNum][0].stageName 
                : `${roundNum}-ci Tur`}
            </span>
            <div className="h-px bg-white/5 flex-grow"></div>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {(rounds[roundNum] || []).map((match) => {
              const home = getTeam(match.homeTeamId);
              const away = getTeam(match.awayTeamId);

              return (
                <MatchCard key={match.id} match={match} home={home} away={away} onSelect={onMatchClick || (() => {})} />
              );
            })}
          </div>
        </div>
      ))}

      {(viewMode === 'bracket' || groupMatches.length === 0) && Object.entries(knockoutRounds).map(([stage, mList]) => (
        <div key={stage} className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-neon font-black text-[10px] md:text-xs uppercase tracking-[0.3em]">{stage}</span>
            <div className="h-px bg-white/5 flex-grow"></div>
          </div>
          
          <div className="grid gap-3 md:gap-4">
            {mList.map((match) => {
              const home = getTeam(match.homeTeamId);
              const away = getTeam(match.awayTeamId);

              return (
                <MatchCard key={match.id} match={match} home={home} away={away} onSelect={onMatchClick || (() => {})} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const MatchCard: React.FC<{ match: Match, home?: Team, away?: Team, onSelect: (id: string) => void }> = ({ match, home, away, onSelect }) => (
  <div className="premium-glass-card rounded-xl md:rounded-2xl border border-white/10 hover:border-neon/50 transition-all shadow-2xl flex flex-col bg-[#050e1c]/80 relative group overflow-hidden">
    <div 
      className="p-3 md:p-8 cursor-pointer flex flex-col gap-3 md:gap-8"
      onClick={() => onSelect(match.id)}
    >
      <div className="flex items-center justify-between relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] md:text-[8px] font-black text-neon/40 uppercase tracking-[0.4em] whitespace-nowrap">
          {match.stageName} {match.date && `• ${match.date}`}
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center p-1 md:p-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0 group-hover:scale-110 transition-transform">
            <img src={home?.logo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[8px] md:text-sm font-black text-white uppercase text-center italic tracking-tight leading-none h-4 md:h-6 flex items-center justify-center">{home?.name}</span>
        </div>

        <div className="flex flex-col items-center gap-1 md:gap-3 px-2 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-8 h-10 md:w-16 md:h-20 text-center text-sm md:text-4xl font-black bg-black border-2 border-white/10 rounded-lg md:rounded-2xl text-white flex items-center justify-center shadow-inner">
              {match.homeScore ?? '-'}
            </div>
            <span className="text-neon font-black text-xs md:text-3xl animate-pulse">:</span>
            <div className="w-8 h-10 md:w-16 md:h-20 text-center text-sm md:text-4xl font-black bg-black border-2 border-white/10 rounded-lg md:rounded-2xl text-white flex items-center justify-center shadow-inner">
              {match.awayScore ?? '-'}
            </div>
          </div>
          {match.penaltyWinnerId && (
            <div className="bg-neon/10 px-2 py-0.5 rounded text-[6px] md:text-[10px] font-black text-neon uppercase tracking-tighter border border-neon/20">
              Penaltilərlə: {match.penaltyWinnerId === match.homeTeamId ? 'EV' : 'SƏF'}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center p-1 md:p-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] shrink-0 group-hover:scale-110 transition-transform">
            <img src={away?.logo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[8px] md:text-sm font-black text-white uppercase text-center italic tracking-tight leading-none h-4 md:h-6 flex items-center justify-center">{away?.name}</span>
        </div>
      </div>

      {match.aiNews && (
        <div className="bg-[#020d2d] border border-emerald-500/40 rounded-lg p-1.5 md:p-5 shadow-[inset_0_0_20px_rgba(57,255,20,0.1)] relative">
           <div className="flex items-center gap-1 mb-1 md:mb-3">
              <span className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-neon animate-pulse"></span>
              <span className="text-[6px] md:text-[9px] font-black text-neon uppercase tracking-[0.3em] italic">FLASH XƏBƏR</span>
           </div>
           <p className="text-[8px] md:text-xs text-white font-bold italic leading-tight tracking-tight relative z-10">
              "{match.aiNews}"
           </p>
        </div>
      )}
    </div>
  </div>
);

export default Fixtures;
