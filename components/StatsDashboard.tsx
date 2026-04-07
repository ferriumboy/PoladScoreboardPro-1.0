import React, { useMemo, useState } from 'react';
import { Team, Match } from '../types';

interface Props {
  onClose: () => void;
  teams: Team[];
  matches: Match[];
  zoomLevel?: number;
  onZoomChange?: (level: number) => void;
}

interface PlayerStats {
  name: string;
  club: string;
  clubLogo: string;
  goals: number;
  assists: number;
  mvps: number;
  yellowCards: number;
  redCards: number;
  score: number;
}

const StatsDashboard: React.FC<Props> = ({ onClose, teams, matches, zoomLevel = 100, onZoomChange }) => {
  const [showAllScorers, setShowAllScorers] = useState(false);
  const [showAllAssists, setShowAllAssists] = useState(false);
  const [showAllMvps, setShowAllMvps] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);

  const allStats = useMemo(() => {
    const players: Record<string, PlayerStats> = {};

    const getPlayer = (name: string, teamId: string) => {
      const n = name.trim();
      if (!n) return null;
      const key = `${n.toLowerCase()}-${teamId}`;
      if (!players[key]) {
        const team = teams.find(t => t.id === teamId);
        players[key] = {
          name: n,
          club: team?.name || '',
          clubLogo: team?.logo || '',
          goals: 0,
          assists: 0,
          mvps: 0,
          yellowCards: 0,
          redCards: 0,
          score: 0
        };
      }
      return players[key];
    };

    matches.forEach(m => {
      (m.homeScorers || []).forEach(name => {
        const p = getPlayer(name, m.homeTeamId);
        if (p) { p.goals++; p.score += 4; }
      });
      (m.awayScorers || []).forEach(name => {
        const p = getPlayer(name, m.awayTeamId);
        if (p) { p.goals++; p.score += 4; }
      });

      (m.homeAssists || []).forEach(name => {
        const p = getPlayer(name, m.homeTeamId);
        if (p) { p.assists++; p.score += 4; }
      });
      (m.awayAssists || []).forEach(name => {
        const p = getPlayer(name, m.awayTeamId);
        if (p) { p.assists++; p.score += 4; }
      });

      (m.homeYellowCards || []).forEach(name => {
        const p = getPlayer(name, m.homeTeamId);
        if (p) { p.yellowCards++; p.score -= 1; }
      });
      (m.awayYellowCards || []).forEach(name => {
        const p = getPlayer(name, m.awayTeamId);
        if (p) { p.yellowCards++; p.score -= 1; }
      });

      (m.homeRedCards || []).forEach(name => {
        const p = getPlayer(name, m.homeTeamId);
        if (p) { p.redCards++; p.score -= 2; }
      });
      (m.awayRedCards || []).forEach(name => {
        const p = getPlayer(name, m.awayTeamId);
        if (p) { p.redCards++; p.score -= 2; }
      });

      if (m.mvp) {
        let mvpTeamId = m.homeTeamId;
        const awayTeam = teams.find(t => t.id === m.awayTeamId);
        if (
          m.awayScorers?.includes(m.mvp) ||
          m.awayAssists?.includes(m.mvp) ||
          m.awayYellowCards?.includes(m.mvp) ||
          m.awayRedCards?.includes(m.mvp) ||
          awayTeam?.players?.some(p => p.name === m.mvp)
        ) {
          mvpTeamId = m.awayTeamId;
        }
        const p = getPlayer(m.mvp, mvpTeamId);
        if (p) { p.mvps++; p.score += 5; }
      }
    });

    return Object.values(players);
  }, [matches, teams]);

  const ballonDorRanking = [...allStats].sort((a, b) => b.score - a.score).slice(0, 3);
  const topScorers = [...allStats].sort((a, b) => b.goals - a.goals).filter(p => p.goals > 0);
  const topAssists = [...allStats].sort((a, b) => b.assists - a.assists).filter(p => p.assists > 0);
  const topMvps = [...allStats].sort((a, b) => b.mvps - a.mvps).filter(p => p.mvps > 0);
  const topCards = [...allStats].sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards)).filter(p => p.redCards > 0 || p.yellowCards > 0);
  
  const mostPenalized = topCards[0];

  const totalYellows = allStats.reduce((sum, p) => sum + p.yellowCards, 0);
  const totalReds = allStats.reduce((sum, p) => sum + p.redCards, 0);

  const defaultLogo = "https://ui-avatars.com/api/?name=Player&background=random";

  return (
    <div className="fixed inset-0 z-[100] bg-surface font-body text-on-surface selection:bg-primary selection:text-on-primary overflow-x-hidden overflow-y-auto animate-in fade-in duration-500">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1421]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(177,198,252,0.12)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="text-2xl font-black tracking-tighter text-[#b1c6fc] italic font-headline uppercase">UCL Stats</div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="font-headline font-bold tracking-tight text-sm uppercase text-[#f5fff2] border-b-2 border-[#f5fff2] pb-1 transition-all" href="#">Oyunçuların Statistikası</a>
          </nav>
          <div className="flex items-center gap-4">
            {onZoomChange && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                <button 
                  onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
                  title="Kiçilt"
                >
                  <span className="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <span className="text-[10px] font-black text-white w-8 text-center">{zoomLevel}%</span>
                <button 
                  onClick={() => onZoomChange(Math.min(150, zoomLevel + 10))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
                  title="Böyüt"
                >
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-2 text-[#b1c6fc] hover:bg-[#f5fff2]/5 rounded-lg transition-all active:scale-95 duration-200">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-b from-[#131c2a] to-transparent h-px w-full"></div>
      </header>
      
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-screen-2xl mx-auto ucl-bg-pattern relative z-10">
        {/* Hero Section: Ballon d'Or Podium */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <span className="font-label text-secondary-fixed-dim tracking-[0.3em] text-xs uppercase font-bold">PREMİUM MÜKAFATLANDIRMA</span>
            <h2 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-white mt-2">BALLON D'OR KÜRSÜSÜ</h2>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 mt-24">
            {/* 2nd Place */}
            <div className="relative group flex flex-col items-center w-full md:w-64 order-2 md:order-1">
              <div className="mb-4 relative">
                <div className="w-32 h-32 rounded-full border-4 border-slate-400/30 overflow-hidden bg-surface-container-high podium-glow transition-transform duration-500 group-hover:scale-110 flex items-center justify-center p-4">
                  <img alt={ballonDorRanking[1]?.club || "Club"} className="w-full h-full object-contain" src={ballonDorRanking[1]?.clubLogo || defaultLogo} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-400 text-on-surface-variant font-headline font-bold px-3 py-1 rounded-full text-sm">2</div>
              </div>
              <div className="w-full h-40 bg-gradient-to-t from-surface-container-highest/80 to-surface-container/40 backdrop-blur-md rounded-t-xl border-t border-x border-white/5 flex flex-col items-center pt-6 px-4">
                <span className="font-headline font-bold text-lg text-white text-center">{ballonDorRanking[1]?.name || "TBD"}</span>
                <span className="font-label text-xs text-on-tertiary-container uppercase tracking-widest mt-1 text-center">{ballonDorRanking[1]?.club || "-"}</span>
                <span className="font-label text-[10px] text-emerald-400 font-bold mt-2">{ballonDorRanking[1]?.score || 0} XAL</span>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="relative group flex flex-col items-center w-full md:w-72 z-10 order-1 md:order-2">
              <div className="mb-6 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-secondary-fixed/20 blur-[60px] rounded-full"></div>
                <div className="w-40 h-40 rounded-full border-4 border-secondary-fixed overflow-hidden bg-surface-container-high podium-glow transition-transform duration-500 group-hover:scale-110 shadow-[0_0_40px_rgba(97,255,151,0.3)] flex items-center justify-center p-6">
                  <img alt={ballonDorRanking[0]?.club || "Club"} className="w-full h-full object-contain" src={ballonDorRanking[0]?.clubLogo || defaultLogo} />
                </div>
                <div className="absolute -bottom-2 -right-2 gold-shimmer text-on-secondary-fixed font-headline font-black px-4 py-2 rounded-full text-lg shadow-xl">1</div>
              </div>
              <div className="w-full h-56 bg-gradient-to-t from-surface-container-highest to-surface-container backdrop-blur-xl rounded-t-2xl border-t border-x border-secondary-fixed/30 flex flex-col items-center pt-8 px-4 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]">
                <span className="font-headline font-black text-2xl text-white tracking-tight text-center">{ballonDorRanking[0]?.name || "TBD"}</span>
                <span className="font-label text-sm text-secondary-fixed uppercase tracking-[0.2em] mt-2 font-bold text-center">{ballonDorRanking[0]?.club || "-"}</span>
                <div className="mt-4 px-4 py-1 rounded-full bg-secondary-fixed/10 border border-secondary-fixed/20 mb-2">
                  <span className="text-secondary-fixed font-bold text-sm tracking-widest uppercase">MVP 2026</span>
                </div>
                <span className="font-label text-xs text-secondary-fixed font-bold">{ballonDorRanking[0]?.score || 0} XAL</span>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="relative group flex flex-col items-center w-full md:w-64 order-3">
              <div className="mb-4 relative">
                <div className="w-32 h-32 rounded-full border-4 border-orange-800/30 overflow-hidden bg-surface-container-high podium-glow transition-transform duration-500 group-hover:scale-110 flex items-center justify-center p-4">
                  <img alt={ballonDorRanking[2]?.club || "Club"} className="w-full h-full object-contain" src={ballonDorRanking[2]?.clubLogo || defaultLogo} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-orange-800 text-white font-headline font-bold px-3 py-1 rounded-full text-sm">3</div>
              </div>
              <div className="w-full h-32 bg-gradient-to-t from-surface-container-highest/80 to-surface-container/40 backdrop-blur-md rounded-t-xl border-t border-x border-white/5 flex flex-col items-center pt-6 px-4">
                <span className="font-headline font-bold text-lg text-white text-center">{ballonDorRanking[2]?.name || "TBD"}</span>
                <span className="font-label text-xs text-on-tertiary-container uppercase tracking-widest mt-1 text-center">{ballonDorRanking[2]?.club || "-"}</span>
                <span className="font-label text-[10px] text-orange-400 font-bold mt-2">{ballonDorRanking[2]?.score || 0} XAL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Goals Section */}
          <div className="bg-surface-container/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-extrabold text-xl tracking-tight text-white uppercase">Ən Çox Qol</h3>
              <span className="material-symbols-outlined text-secondary-fixed text-2xl">sports_soccer</span>
            </div>
            <div className="space-y-4 flex-1">
              {topScorers.length === 0 ? (
                 <div className="text-center text-white/30 text-sm py-4">Hələ qol vurulmayıb</div>
              ) : (
                <>
                  {(showAllScorers ? topScorers : topScorers.slice(0, 5)).map((p, i) => (
                    <div key={`goal-${i}`} className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                      <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center p-1">
                        <img alt={p.club} className="w-full h-full object-contain" src={p.clubLogo || defaultLogo} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-on-tertiary-container">{p.club}</div>
                      </div>
                      <div className={`text-xl font-black ${i === 0 ? 'text-secondary-fixed' : 'text-on-surface'}`}>{p.goals}</div>
                    </div>
                  ))}
                  {topScorers.length > 5 && (
                    <button 
                      onClick={() => setShowAllScorers(!showAllScorers)}
                      className="w-full py-2 mt-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
                    >
                      {showAllScorers ? 'Daha az göstər' : 'Hamısını göstər'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Assists Section */}
          <div className="bg-surface-container/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-extrabold text-xl tracking-tight text-white uppercase">Ən Çox Asist</h3>
              <span className="material-symbols-outlined text-primary text-2xl">assistant</span>
            </div>
            <div className="space-y-4 flex-1">
              {topAssists.length === 0 ? (
                 <div className="text-center text-white/30 text-sm py-4">Hələ asist edilməyib</div>
              ) : (
                <>
                  {(showAllAssists ? topAssists : topAssists.slice(0, 5)).map((p, i) => (
                    <div key={`assist-${i}`} className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                      <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center p-1">
                        <img alt={p.club} className="w-full h-full object-contain" src={p.clubLogo || defaultLogo} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-on-tertiary-container">{p.club}</div>
                      </div>
                      <div className={`text-xl font-black ${i === 0 ? 'text-primary' : 'text-on-surface'}`}>{p.assists}</div>
                    </div>
                  ))}
                  {topAssists.length > 5 && (
                    <button 
                      onClick={() => setShowAllAssists(!showAllAssists)}
                      className="w-full py-2 mt-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
                    >
                      {showAllAssists ? 'Daha az göstər' : 'Hamısını göstər'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Most MVP Awards Section */}
          <div className="bg-surface-container/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-extrabold text-xl tracking-tight text-white uppercase">Ən çox MVP</h3>
              <span className="material-symbols-outlined text-secondary-fixed-dim text-2xl">star</span>
            </div>
            <div className="space-y-4 flex-1">
              {topMvps.length === 0 ? (
                 <div className="text-center text-white/30 text-sm py-4">Hələ MVP seçilməyib</div>
              ) : (
                <>
                  {(showAllMvps ? topMvps : topMvps.slice(0, 5)).map((p, i) => (
                    <div key={`mvp-${i}`} className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                      <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center p-1">
                        <img alt={p.club} className="w-full h-full object-contain" src={p.clubLogo || defaultLogo} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">{p.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-on-tertiary-container">{p.club}</div>
                      </div>
                      <div className={`text-xl font-black ${i === 0 ? 'text-secondary-fixed-dim' : 'text-on-surface'}`}>{p.mvps}</div>
                    </div>
                  ))}
                  {topMvps.length > 5 && (
                    <button 
                      onClick={() => setShowAllMvps(!showAllMvps)}
                      className="w-full py-2 mt-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
                    >
                      {showAllMvps ? 'Daha az göstər' : 'Hamısını göstər'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Disciplinary Section */}
          <div className="bg-surface-container/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-extrabold text-xl tracking-tight text-white leading-tight uppercase">Vərəqələr</h3>
              <span className="material-symbols-outlined text-error text-2xl">style</span>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">Sarı Vərəqələr</div>
                  <div className="text-[10px] uppercase tracking-wider text-on-tertiary-container">Ümumi Turnir</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 bg-yellow-400 rounded-sm"></div>
                  <div className="text-xl font-black text-white">{totalYellows}</div>
                </div>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all">
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">Qırmızı Vərəqələr</div>
                  <div className="text-[10px] uppercase tracking-wider text-on-tertiary-container">Ümumi Turnir</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 bg-error rounded-sm"></div>
                  <div className="text-xl font-black text-white">{totalReds}</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-[9px] font-bold uppercase tracking-widest text-on-tertiary-container mb-3">Cəzalandırılan Oyunçular</div>
                {topCards.length === 0 ? (
                  <div className="text-center text-white/30 text-sm py-2">Hələ vərəqə alan yoxdur</div>
                ) : (
                  <>
                    {(showAllCards ? topCards : topCards.slice(0, 3)).map((p, i) => (
                      <div key={`card-${i}`} className="flex items-center gap-3 p-2 bg-surface-container-highest/20 hover:bg-surface-container-highest/40 border border-white/5 rounded-xl mb-2 transition-all">
                        <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center p-1">
                          <img alt={p.club} className="w-full h-full object-contain" src={p.clubLogo || defaultLogo} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[10px] text-white">{p.name}</div>
                          <div className="text-[8px] uppercase tracking-wider text-on-tertiary-container">{p.club}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                          {p.yellowCards > 0 && <span className="text-yellow-400 flex items-center gap-1">{p.yellowCards} <div className="w-2 h-3 bg-yellow-400 rounded-[1px]"></div></span>}
                          {p.redCards > 0 && <span className="text-error flex items-center gap-1">{p.redCards} <div className="w-2 h-3 bg-error rounded-[1px]"></div></span>}
                        </div>
                      </div>
                    ))}
                    {topCards.length > 3 && (
                      <button 
                        onClick={() => setShowAllCards(!showAllCards)}
                        className="w-full py-2 mt-1 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
                      >
                        {showAllCards ? 'Daha az göstər' : 'Hamısını göstər'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-[#0a1421]/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center px-8 pb-6 pt-2">
        <button onClick={onClose} className="flex flex-col items-center justify-center bg-[#f5fff2]/10 text-[#f5fff2] rounded-full p-3 transition-all duration-300 ease-out scale-110">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="font-['Inter'] text-[10px] font-medium tracking-widest uppercase mt-1">Panel</span>
        </button>
        <button onClick={onClose} className="flex flex-col items-center justify-center text-[#6386be] p-3 hover:text-[#f5fff2] transition-all">
          <span className="material-symbols-outlined">live_tv</span>
          <span className="font-['Inter'] text-[10px] font-medium tracking-widest uppercase mt-1">Canlı</span>
        </button>
        <button onClick={onClose} className="flex flex-col items-center justify-center text-[#6386be] p-3 hover:text-[#f5fff2] transition-all">
          <span className="material-symbols-outlined">format_list_numbered</span>
          <span className="font-['Inter'] text-[10px] font-medium tracking-widest uppercase mt-1">Cədvəl</span>
        </button>
        <button onClick={onClose} className="flex flex-col items-center justify-center text-[#6386be] p-3 hover:text-[#f5fff2] transition-all">
          <span className="material-symbols-outlined">person</span>
          <span className="font-['Inter'] text-[10px] font-medium tracking-widest uppercase mt-1">Profil</span>
        </button>
      </nav>

      {/* Visual Enhancements: Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-fixed/5 blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0a1421_100%)]"></div>
      </div>
    </div>
  );
};

export default StatsDashboard;
