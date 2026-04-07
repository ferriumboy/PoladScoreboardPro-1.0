
import React from 'react';
import { SavedTournament, TournamentType } from '../types';
import Standings from './Standings';

interface Props {
  tournament: SavedTournament;
  onBack: () => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const HistoryDetails: React.FC<Props> = ({ tournament, onBack }) => {
  const calculateTopScorers = () => {
    const scorers: Record<string, number> = {};
    (tournament.matches || []).forEach(m => {
      if (m.isFinished) {
        m.homeScorers?.forEach(s => { if(s && s.trim()) scorers[s] = (scorers[s] || 0) + 1; });
        m.awayScorers?.forEach(s => { if(s && s.trim()) scorers[s] = (scorers[s] || 0) + 1; });
      }
    });
    return Object.entries(scorers).sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const topScorers = calculateTopScorers();

  const rounds: Record<number, any[]> = {};
  (tournament.matches || []).forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const sortedRounds = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all"
        >
          <span className="material-icons text-sm">arrow_back</span> GERİ
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-white uppercase italic">{tournament.name}</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tournament.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Standings */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-neon rounded-full shadow-neon"></div>
            <h3 className="text-xl font-black text-white uppercase italic">Yekun Cədvəl</h3>
          </div>
          <Standings standings={tournament.standings} isFinished={false} />
          
          {/* Matches */}
          <div className="space-y-6 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-neon rounded-full shadow-neon"></div>
              <h3 className="text-xl font-black text-white uppercase italic">Matçlar</h3>
            </div>
            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {(sortedRounds || []).map(roundNum => (
                <div key={roundNum} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-neon font-black text-[10px] uppercase tracking-[0.3em]">{roundNum}. TUR</span>
                    <div className="h-px bg-white/5 flex-grow"></div>
                  </div>
                  <div className="grid gap-3">
                    {(rounds[roundNum] || []).map(match => {
                      const homeStanding = (tournament.standings || []).find(s => s.teamId === match.homeTeamId);
                      const awayStanding = (tournament.standings || []).find(s => s.teamId === match.awayTeamId);
                      return (
                        <div key={match.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex-1 flex items-center gap-3">
                            <img src={homeStanding?.teamLogo || DEFAULT_LOGO} className="w-8 h-8 object-contain" alt="" />
                            <span className="text-[10px] font-black text-white uppercase truncate">{homeStanding?.teamName}</span>
                          </div>
                          <div className="flex items-center gap-3 px-4">
                            <span className="text-xl font-black text-white">{match.homeScore ?? '-'}</span>
                            <span className="text-white/20">:</span>
                            <span className="text-xl font-black text-white">{match.awayScore ?? '-'}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-end gap-3">
                            <span className="text-[10px] font-black text-white uppercase truncate text-right">{awayStanding?.teamName}</span>
                            <img src={awayStanding?.teamLogo || DEFAULT_LOGO} className="w-8 h-8 object-contain" alt="" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Scorers */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-neon rounded-full shadow-neon"></div>
            <h3 className="text-xl font-black text-white uppercase italic">Bombardirlər</h3>
          </div>
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40">
            {(topScorers || []).length > 0 ? (
              <div className="space-y-4">
                {(topScorers || []).map(([name, goals], idx) => (
                  <div key={`scorer-${name}-${idx}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-neon">{idx + 1}.</span>
                      <span className="text-xs font-bold text-white uppercase">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{goals}</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">QOL</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500 text-xs font-bold uppercase italic">Məlumat yoxdur</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetails;
