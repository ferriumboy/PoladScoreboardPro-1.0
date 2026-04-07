
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
  zoomLevel?: number;
  onZoomChange?: (level: number) => void;
  onMatchClick?: (id: string) => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const Fixtures: React.FC<Props> = ({ matches, teams, teamPlayers, onUpdateScore, onStartInterview, type, zoomLevel = 100, onZoomChange, onMatchClick }) => {
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
            <span className="text-neon font-black text-[10px] md:text-xs uppercase tracking-[0.3em]">{rounds[roundNum][0]?.stageName || `${roundNum}. TUR`}</span>
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
  <div className="premium-glass-card rounded-xl md:rounded-2xl border border-white/5 hover:border-neon/30 transition-all shadow-xl flex flex-col bg-[#020d2d]/60 relative group overflow-hidden">
    <div 
      className="p-2 md:p-6 cursor-pointer flex flex-col gap-2 md:gap-6"
      onClick={() => onSelect(match.id)}
    >
      <div className="flex items-center justify-between">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[5px] md:text-[7px] font-black text-white/20 uppercase tracking-widest">{match.stageName}</div>
        
        <div className="flex-1 flex flex-col items-center gap-0.5 md:gap-2">
          <div className="w-6 h-6 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center p-0.5 md:p-1.5 shadow-lg shrink-0">
            <img src={home?.logo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[6px] md:text-[10px] font-black text-white uppercase text-center truncate w-full px-1">{home?.name}</span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-6 h-8 md:w-12 md:h-14 text-center text-xs md:text-2xl font-black bg-black/80 border border-white/10 rounded-md md:rounded-xl text-white flex items-center justify-center">
              {match.homeScore ?? '-'}
            </div>
            <span className="text-white/20 font-black text-[8px] md:text-base">:</span>
            <div className="w-6 h-8 md:w-12 md:h-14 text-center text-xs md:text-2xl font-black bg-black/80 border border-white/10 rounded-md md:rounded-xl text-white flex items-center justify-center">
              {match.awayScore ?? '-'}
            </div>
          </div>
          {match.penaltyWinnerId && (
            <div className="text-[5px] font-black text-neon uppercase tracking-tighter">Penaltilərlə: {match.penaltyWinnerId === match.homeTeamId ? 'EV' : 'SƏF'}</div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5 md:gap-2">
          <div className="w-6 h-6 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center p-0.5 md:p-1.5 shadow-lg shrink-0">
            <img src={away?.logo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[6px] md:text-[10px] font-black text-white uppercase text-center truncate w-full px-1">{away?.name}</span>
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
