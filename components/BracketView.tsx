import React from 'react';
import { Match, Team } from '../types';

interface Props {
  matches: Match[];
  teams: Team[];
  onMatchClick: (matchId: string) => void;
}

interface Tie {
  leg1: Match;
  leg2?: Match;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const BracketView: React.FC<Props> = ({ matches, teams, onMatchClick }) => {
  const knockoutMatches = matches.filter(m => m.isKnockout);
  
  const getTeam = (id: string) => {
    if (id === 'tbd' || id.startsWith('G_') || id.startsWith('L_')) return { name: 'Gözlənilir', logo: DEFAULT_LOGO };
    if (id === 'bye') return { name: 'BYE', logo: DEFAULT_LOGO };
    const team = teams.find(t => t.id === id);
    if (!team) return { name: 'Gözlənilir', logo: DEFAULT_LOGO };
    return team;
  };

  const uniqueRounds = Array.from(new Set(knockoutMatches.filter(m => !m.isSecondLeg).map(m => m.round))).sort((a, b) => (a as number) - (b as number));
  const N = uniqueRounds.length;

  if (N === 0) return null;

  const columns = Array.from({ length: 2 * N - 1 }, (_, c) => {
    let roundIndex;
    let isLeftSide = true;
    let isCenter = false;

    if (c < N - 1) {
      roundIndex = c;
      isLeftSide = true;
    } else if (c === N - 1) {
      roundIndex = c;
      isCenter = true;
    } else {
      roundIndex = 2 * N - 2 - c;
      isLeftSide = false;
    }

    const roundNum = uniqueRounds[roundIndex];
    const allTiesInRound = knockoutMatches
      .filter(m => m.round === roundNum && !m.isSecondLeg)
      .map(leg1 => ({
        leg1,
        leg2: knockoutMatches.find(m => m.firstLegMatchId === leg1.id)
      }));

    let tiesForColumn: Tie[] = [];
    if (isCenter) {
      tiesForColumn = allTiesInRound;
    } else {
      const half = Math.ceil(allTiesInRound.length / 2);
      if (isLeftSide) {
        tiesForColumn = allTiesInRound.slice(0, half);
      } else {
        tiesForColumn = allTiesInRound.slice(half);
      }
    }

    return {
      colIndex: c,
      isLeftSide,
      isCenter,
      ties: tiesForColumn,
      stageName: tiesForColumn[0]?.leg1.stageName?.replace(/ \(.*?\)/, '') || `Round ${roundNum}`
    };
  });

  const recentMatches = [...matches].filter(m => m.isFinished).sort((a, b) => b.id.localeCompare(a.id)).slice(0, 4);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-12 pt-8 flex flex-col items-start md:items-center">
      <div className="flex min-w-max gap-4 md:gap-12 px-4 items-center justify-start md:justify-center">
        {columns.map((col) => (
          <div key={col.colIndex} className={`flex flex-col justify-around gap-4 md:gap-8 ${col.isCenter ? 'w-[260px] md:w-[320px]' : 'w-[200px] md:w-[240px]'}`}>
            {!col.isCenter && (
              <div className={`text-center mb-4 ${col.isLeftSide ? 'border-r-2 pr-4' : 'border-l-2 pl-4'} border-neon/20`}>
                <span className="font-headline text-[10px] text-neon/80 uppercase tracking-[0.4em] font-black">
                  {col.stageName}
                </span>
              </div>
            )}
            
            <div className="flex flex-col justify-around flex-1 gap-4 md:gap-8">
              {col.ties.map((tie, idx) => {
                const home = getTeam(tie.leg1.homeTeamId) || { name: 'Gözlənilir', logo: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png' };
                const away = getTeam(tie.leg1.awayTeamId) || { name: 'Gözlənilir', logo: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png' };
                
                let homeScore = tie.leg1.homeScore;
                let awayScore = tie.leg1.awayScore;
                if (tie.leg2 && tie.leg2.homeScore !== null) {
                  homeScore = (homeScore || 0) + (tie.leg2.awayScore || 0);
                  awayScore = (awayScore || 0) + (tie.leg2.homeScore || 0);
                }

                if (col.isCenter) {
                  return (
                    <div key={tie.leg1.id} className="flex flex-col items-center relative">
                      <div className="text-center mb-10">
                        <span className="font-headline text-4xl md:text-5xl text-white uppercase tracking-[0.6em] font-black drop-shadow-[0_0_20px_rgba(177,198,252,0.3)]">FİNAL</span>
                      </div>
                      <div className="relative w-full max-w-md">
                        <div className="absolute -inset-10 card-glow pointer-events-none opacity-60"></div>
                        <div className="absolute -inset-20 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                        
                        <div 
                          className="relative midnight-glass p-5 md:p-8 rounded-[2.5rem] flex flex-col items-center overflow-hidden cursor-pointer hover:border-neon/50 transition-all"
                          onClick={() => onMatchClick(tie.leg1.id)}
                        >
                          {tie.leg1.isFinished && (
                            <div className="mb-8">
                              <span className="bg-neon/20 text-neon text-[9px] font-black px-5 py-2 rounded-full flex items-center gap-2 shadow-[0_4px_15px_rgba(57,255,20,0.4)] uppercase tracking-[0.2em] border border-neon/20">
                                BİTİB
                              </span>
                            </div>
                          )}
                          
                          <div className="relative mb-8 group">
                            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <img alt="Trophy" className="w-20 h-20 md:w-28 md:h-28 object-contain trophy-glow relative z-10 transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE0--C_u0sz9TUM_HnwI3Xh_rzq6xeeAm-YBk4ubrMj465GSiaE7hauJA0_9bMZK-HGPuUxo1gtcgrRJ0IEGy_gT6iuSMqVGyLRtL0VwYbwTVy3n8r_Em-RigwIlylHh5OA_uia7eqN_cVLvhOPF8ssJGfRmugZ6DsAfD5mMUAd7FFbnxteT9CwPUMtYEaKJNBe_GHB0f8v0iJivAuQANdzUmuVEcv_zahYUkUkGGuj3wLmGX2i-4Ns3--udnSm9mGc_ngao6KPW4"/>
                          </div>
                          
                          <div className="w-full flex flex-col items-center gap-6">
                            <div className="w-full grid grid-cols-3 items-center gap-2">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 p-2 shadow-lg border border-white/10 flex items-center justify-center">
                                  <img alt={home.name} className="w-full h-full object-contain" src={home.logo}/>
                                </div>
                                <h3 className="font-headline font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-center text-white">{home.name}</h3>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center">
                                <div className="score-font text-2xl md:text-4xl text-white flex items-center gap-2 md:gap-3 leading-none">
                                  <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{homeScore ?? '-'}</span>
                                  <span className="text-sm md:text-lg text-primary/30 font-medium">—</span>
                                  <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{awayScore ?? '-'}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 p-2 shadow-lg border border-white/10 flex items-center justify-center">
                                  <img alt={away.name} className="w-full h-full object-contain" src={away.logo}/>
                                </div>
                                <h3 className="font-headline font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-center text-white">{away.name}</h3>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-3 mt-4 pt-6 border-t border-white/5 w-full">
                              <span className="font-label text-[10px] uppercase tracking-[0.5em] text-primary font-black">UEFA CHAMPIONS LEAGUE</span>
                              <div className="flex items-center gap-3 text-on-surface/40">
                                <span className="font-label text-[9px] uppercase tracking-[0.3em]">30 MAY 2026</span>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span className="font-label text-[9px] uppercase tracking-[0.3em]">WEMBLEY STADİONU, LONDON</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={tie.leg1.id} className="relative w-full group">
                    {col.isLeftSide ? (
                      <div className="absolute -right-4 md:-right-8 top-1/2 w-4 md:w-8 h-[1px] connector-line opacity-50"></div>
                    ) : (
                      <div className="absolute -left-4 md:-left-8 top-1/2 w-4 md:w-8 h-[1px] connector-line opacity-50"></div>
                    )}

                    <div 
                      className="glass-card p-3 md:p-4 rounded-2xl transition-all duration-500 hover:border-neon/40 hover:bg-[#1e293b]/70 cursor-pointer"
                      onClick={() => onMatchClick(tie.leg1.id)}
                    >
                      <div className="flex justify-between items-center mb-3 md:mb-4">
                        {tie.leg1.isFinished ? (
                          <span className="bg-white/10 text-white/60 text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-full uppercase border border-white/10">BİTİB</span>
                        ) : (
                          <span className="bg-white/5 text-white/40 text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-full uppercase border border-white/5">GÖZLƏNİLİR</span>
                        )}
                        {tie.leg2 && (
                          <span className="text-[8px] text-white/40 uppercase tracking-widest">2 Oyun</span>
                        )}
                      </div>
                      
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-[#1c2533] p-1 border border-white/5">
                              <img alt={home.name} className="w-full h-full object-contain" src={home.logo}/>
                            </div>
                            <span className="font-headline font-bold text-[9px] md:text-[11px] uppercase tracking-wide text-white">{home.name}</span>
                          </div>
                          <span className={`font-headline text-base md:text-lg font-black ${homeScore !== null && homeScore > (awayScore || 0) ? 'text-neon' : 'text-white'}`}>{homeScore ?? '-'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-[#1c2533] p-1 border border-white/5">
                              <img alt={away.name} className="w-full h-full object-contain" src={away.logo}/>
                            </div>
                            <span className="font-headline font-bold text-[9px] md:text-[11px] uppercase tracking-wide text-white">{away.name}</span>
                          </div>
                          <span className={`font-headline text-base md:text-lg font-black ${awayScore !== null && awayScore > (homeScore || 0) ? 'text-neon' : 'text-white'}`}>{awayScore ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {recentMatches.length > 0 && (
        <section className="mt-40 w-full max-w-7xl">
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-4">
              <span className="w-12 h-[2px] bg-primary/40"></span>
              <h2 className="font-headline text-[11px] uppercase tracking-[0.5em] text-on-surface/80 font-black">SON OYUNLAR</h2>
            </div>
            <button className="font-label text-[10px] text-primary/80 hover:text-primary uppercase tracking-[0.2em] transition-all border border-primary/20 hover:bg-primary/5 px-5 py-2.5 rounded-full">
              BÜTÜN NƏTİCƏLƏR
            </button>
          </div>
          <div className="flex flex-nowrap overflow-x-auto gap-4 px-4 pb-4 custom-scrollbar snap-x w-full">
            {recentMatches.map(match => {
              const home = getTeam(match.homeTeamId) || { name: 'Gözlənilir', logo: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png' };
              const away = getTeam(match.awayTeamId) || { name: 'Gözlənilir', logo: 'https://cdn-icons-png.flaticon.com/512/1160/1160358.png' };
              return (
                <div key={match.id} onClick={() => onMatchClick(match.id)} className="glass-card p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.05] transition-all min-w-[280px] md:min-w-[320px] snap-center">
                  <div className="flex flex-col items-center gap-3">
                    <img alt={home?.name} className="w-8 h-8 rounded-full border border-white/10" src={home?.logo} />
                    <span className="font-label text-[9px] font-bold uppercase tracking-widest text-on-surface/60">{home?.name?.substring(0, 3)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-headline text-xl font-black text-on-surface">{match.homeScore} : {match.awayScore}</span>
                    <span className="font-label text-[8px] text-on-surface-variant/40 uppercase mt-1.5 font-bold tracking-widest">BİTİB</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <img alt={away?.name} className="w-8 h-8 rounded-full border border-white/10" src={away?.logo} />
                    <span className="font-label text-[9px] font-bold uppercase tracking-widest text-on-surface/60">{away?.name?.substring(0, 3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default BracketView;
