import React, { useMemo } from 'react';
import { Match, Team, TournamentState, TournamentMode } from '../types';
import { calculateStandings } from '../utils/tournamentLogic';

interface Props {
  state: TournamentState;
  onMatchClick: (matchId: string) => void;
  onOpenStats: () => void;
  onOpenSocial: () => void;
  onOpenMenu: () => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const UclKnockoutView: React.FC<Props> = ({ state, onMatchClick, onOpenStats, onOpenSocial, onOpenMenu }) => {
  const getTeam = (id: string) => {
    if (id === 'tbd' || id.startsWith('G_') || id.startsWith('L_') || id.startsWith('POW_')) return { name: 'Gözlənilir', logo: DEFAULT_LOGO };
    if (id === 'bye') return { name: 'BYE', logo: DEFAULT_LOGO };
    const team = state.teams.find(t => t.id === id);
    return team || { name: 'Gözlənilir', logo: DEFAULT_LOGO };
  };

  const getMatchDateTime = (matchId: string, matchIndex: number, isFinished: boolean) => {
    const now = new Date();
    const matchDate = new Date(now);
    
    // Use match index to offset dates sequentially
    // Finished matches are in the past, upcoming in the future
    const offset = isFinished ? -(10 - matchIndex) : (matchIndex + 1);
    matchDate.setDate(now.getDate() + offset);
    
    const month = matchDate.getMonth() + 1; // 1-12
    // Spring (3,4,5), Summer (6,7,8) -> 21:45, 23:00
    // Autumn (9,10,11), Winter (12,1,2) -> 22:45, 00:00
    const isSummer = month >= 3 && month <= 8;
    
    const times = isSummer ? ["21:45", "23:00"] : ["22:45", "00:00"];
    // Use a hash of the matchId to pick a consistent time
    const timeIndex = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 2;
    const timeStr = times[timeIndex];
    
    const day = matchDate.getDate();
    const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
    const dateStr = `${day} ${monthNames[matchDate.getMonth()]}`;
    
    return { dateStr, timeStr };
  };

  const knockoutMatches = state.matches.filter(m => m.isKnockout);
  const finishedMatches = [...state.matches].filter(m => m.isFinished).sort((a, b) => b.round - a.round);
  const upcomingMatches = state.matches.filter(m => !m.isFinished);
  
  const allCalendarMatches = [...finishedMatches.slice(0, 8), ...upcomingMatches.slice(0, 8)];

  // Group matches by round
  const uniqueRounds = Array.from(new Set(knockoutMatches.filter(m => !m.isSecondLeg).map(m => m.round))).sort((a, b) => (a as number) - (b as number));
  const N = uniqueRounds.length;

  // We need to adapt the HTML to support dynamic rounds.
  // The HTML has a 3-column layout: Left, Center, Right.
  // We can use the same logic as BracketView to generate columns, but apply the HTML styling.
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

    let tiesForColumn = [];
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

  const [bracketZoom, setBracketZoom] = React.useState(100);

  return (
    <div className="flex-1 min-h-screen bg-[#020617] text-[#dae3f6] font-body antialiased relative overflow-x-hidden" style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, #001B48 0%, #020617 100%)' }}>
      <style>{`
        .star-field {
            background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
            background-size: 80px 80px;
        }
        .glass-card {
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        .midnight-glass {
            background: linear-gradient(135deg, rgba(0, 27, 72, 0.8) 0%, rgba(0, 11, 40, 0.9) 100%);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(177, 198, 252, 0.15);
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
        }
        .connector-line {
            background: linear-gradient(90deg, rgba(177, 198, 252, 0.4) 0%, rgba(97, 255, 151, 0.4) 100%);
        }
        .bracket-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            padding: 6rem 1rem 4rem 1rem;
            overflow-x: auto;
            overflow-y: auto;
        }
        @media (min-width: 768px) {
            .bracket-container {
                padding: 8rem 2rem 6rem 2rem;
                align-items: center;
            }
        }
        .nav-icon-panel {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
        }
        .score-font {
            font-family: 'Manrope', sans-serif;
            font-weight: 800;
            letter-spacing: -0.05em;
        }
        .trophy-glow {
            filter: drop-shadow(0 0 40px rgba(177, 198, 252, 0.4));
        }
        .card-glow {
            background: radial-gradient(circle at center, rgba(177, 198, 252, 0.15) 0%, transparent 70%);
        }
        .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(177, 198, 252, 0.2);
            border-radius: 3px;
        }
      `}</style>

      {/* Atmospheric Overlays */}
      <div className="fixed inset-0 star-field opacity-60 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(177,198,252,0.12),_transparent_60%)] pointer-events-none"></div>
      
      {/* Header & Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 md:py-6 flex justify-between items-start bg-black/20 backdrop-blur-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00e476] shadow-[0_0_10px_#61ff97]"></span>
            <span className="font-label text-[10px] uppercase tracking-[0.4em] text-[#61ff97]">UEFA ELİT</span>
          </div>
          <h1 className="font-headline text-lg md:text-2xl font-extrabold tracking-tight text-[#dae3f6] flex items-center gap-2 md:gap-3">
            CHAMPIONS LEAGUE 
            <span className="font-body font-light text-[#dae3f6]/40">/</span>
            <span className="text-[#b1c6fc] font-medium text-sm md:text-lg">PLEY-OFF</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 mr-2">
            <button 
              onClick={() => setBracketZoom(Math.max(40, bracketZoom - 10))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="text-[10px] font-black text-white/60 w-8 text-center">{bracketZoom}%</span>
            <button 
              onClick={() => setBracketZoom(Math.min(120, bracketZoom + 10))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <div className="hidden md:flex items-center nav-icon-panel rounded-full p-1 px-5 gap-5">
            <button onClick={onOpenStats} className="text-[#dae3f6]/60 hover:text-[#b1c6fc] transition-colors py-1.5 flex items-center"><span className="material-symbols-outlined text-[22px]">leaderboard</span></button>
            <button onClick={onOpenSocial} className="text-[#dae3f6]/60 hover:text-[#b1c6fc] transition-colors py-1.5 flex items-center">
              <svg className="w-[22px] h-[22px] fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </button>
            <button onClick={onOpenMenu} className="text-[#dae3f6]/60 hover:text-[#b1c6fc] transition-colors py-1.5 flex items-center"><span className="material-symbols-outlined text-[22px]">menu</span></button>
            <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
            <button onClick={onOpenMenu} className="text-[#dae3f6]/60 hover:text-[#b1c6fc] transition-colors py-1.5 flex items-center"><span className="material-symbols-outlined text-[22px]">settings</span></button>
          </div>
          <button onClick={onOpenMenu} className="md:hidden w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#1e293b] flex items-center justify-center cursor-pointer hover:border-[#b1c6fc]/40 transition-colors">
            <span className="material-symbols-outlined text-[#dae3f6]/60">menu</span>
          </button>
          <div onClick={onOpenMenu} className="hidden md:flex w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#1e293b] items-center justify-center cursor-pointer hover:border-[#b1c6fc]/40 transition-colors">
            <span className="material-symbols-outlined text-[#dae3f6]/60">person</span>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto custom-scrollbar relative z-0 pb-32">
        <div className="container mx-auto px-4 py-6 md:py-12">
          {/* League Table Section (Only for League modes) */}
          {(state.mode === TournamentMode.LEAGUE_KNOCKOUT || state.mode === TournamentMode.LEAGUE) && (
            <section className="mb-16 md:mb-24 animate-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center gap-3 mb-8 md:mb-12">
                <div className="w-1.5 h-8 bg-[#61ff97] rounded-full shadow-[0_0_20px_rgba(97,255,151,0.6)]"></div>
                <h2 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Cədvəl</h2>
              </div>
              
              <div className="midnight-glass rounded-[2.5rem] p-4 md:p-10 border border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute -inset-20 bg-[#b1c6fc]/5 blur-[120px] rounded-full pointer-events-none group-hover:opacity-100 transition-opacity opacity-50"></div>
                <div className="overflow-x-auto custom-scrollbar relative z-10">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-[8px] md:text-[11px] uppercase font-black tracking-[0.3em] text-[#b1c6fc]/40">
                        <th className="pb-6 pl-4 w-16 text-center">#</th>
                        <th className="pb-6 pl-4">KLUB</th>
                        <th className="pb-6 text-center text-white font-black">PTS</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">O</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">Q</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">H</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">M</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">VQ</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">BQ</th>
                        <th className="pb-6 text-center text-[#b1c6fc]">TF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateStandings(state.teams, state.matches.filter(m => !m.isKnockout)).map((s, idx) => (
                        <tr key={s.teamId} className="border-b border-white/5 hover:bg-white/[0.03] transition-all group">
                          <td className="py-5 pl-4 text-center">
                            <span className="text-xs md:text-sm font-bold text-white/20 group-hover:text-white transition-colors">{idx + 1}</span>
                          </td>
                          <td className="py-5 pl-4">
                            <div className="flex items-center gap-4 md:gap-6">
                              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 p-2 border border-white/10 shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                <img src={s.teamLogo || DEFAULT_LOGO} className="w-full h-full object-contain" alt="" />
                              </div>
                              <span className="text-sm md:text-xl font-black text-white tracking-tight uppercase italic truncate max-w-[200px]">{s.teamName}</span>
                            </div>
                          </td>
                          <td className="py-5 text-center">
                            <span className="text-xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{s.pts}</span>
                          </td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.played}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.won}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.drawn}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.lost}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.gf}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.ga}</td>
                          <td className="py-5 text-center text-xs md:text-base font-bold text-[#b1c6fc]/70">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Play-off Tree Section */}
          {state.mode !== TournamentMode.LEAGUE && (
            <section className="mb-16 md:mb-24 animate-in slide-in-from-bottom-10 duration-700 delay-200">
            <div className="flex items-center gap-3 mb-8 md:mb-12">
              <div className="w-1.5 h-8 bg-[#61ff97] rounded-full shadow-[0_0_20px_rgba(97,255,151,0.6)]"></div>
              <h2 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">PLEY-OFF AĞACI</h2>
            </div>

            <div className="bracket-container overflow-x-auto custom-scrollbar pb-12">
              <div className="flex min-w-max gap-4 md:gap-12 lg:gap-24 items-center justify-start md:justify-center px-4" style={{ transform: `scale(${bracketZoom / 100})`, transformOrigin: 'left top' }}>
            {columns.map((col) => (
              <div key={col.colIndex} className={`flex flex-col justify-around gap-8 md:gap-12 lg:gap-24 ${col.isCenter ? 'w-[280px] md:w-[400px] items-center' : col.isLeftSide ? 'w-[200px] md:w-[300px] items-end' : 'w-[200px] md:w-[300px] items-start'}`}>
                {!col.isCenter && (
                  <div className={`text-${col.isLeftSide ? 'right' : 'left'} w-full ${col.isLeftSide ? 'pr-4 border-r-2' : 'pl-4 border-l-2'} border-[#b1c6fc]/20 mb-4`}>
                    <span className="font-headline text-[8px] md:text-[10px] text-[#b1c6fc]/80 uppercase tracking-[0.4em] font-black">{col.stageName}</span>
                  </div>
                )}

                <div className={`flex flex-col justify-around flex-1 gap-8 md:gap-12 lg:gap-24 w-full`}>
                  {col.ties.map((tie) => {
                    const home = getTeam(tie.leg1.homeTeamId);
                    const away = getTeam(tie.leg1.awayTeamId);
                    
                    let homeScore = tie.leg1.homeScore;
                    let awayScore = tie.leg1.awayScore;
                    if (tie.leg2 && tie.leg2.homeScore !== null) {
                      homeScore = (homeScore || 0) + (tie.leg2.awayScore || 0);
                      awayScore = (awayScore || 0) + (tie.leg2.homeScore || 0);
                    }

                    if (col.isCenter) {
                      return (
                        <div key={tie.leg1.id} className="flex flex-col items-center relative cursor-pointer" onClick={() => onMatchClick(tie.leg1.id)}>
                          <div className="text-center mb-10">
                            <span className="font-headline text-4xl md:text-5xl text-white uppercase tracking-[0.6em] font-black drop-shadow-[0_0_20px_rgba(177,198,252,0.3)]">FİNAL</span>
                          </div>
                          <div className="relative w-full max-w-md">
                            <div className="absolute -inset-10 card-glow pointer-events-none opacity-60"></div>
                            <div className="absolute -inset-20 bg-[#b1c6fc]/5 blur-[120px] rounded-full pointer-events-none"></div>
                            
                            <div className="relative midnight-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center overflow-hidden transition-transform hover:scale-105">
                              {tie.leg1.isFinished && (
                                <div className="mb-6 md:mb-8">
                                  <span className="bg-[#00e476] text-[#00210c] text-[9px] font-black px-4 md:px-5 py-1.5 md:py-2 rounded-full flex items-center gap-2 shadow-[0_4px_15px_rgba(97,255,151,0.4)] uppercase tracking-[0.2em] border border-white/20">
                                    BİTİB
                                  </span>
                                </div>
                              )}
                              {!tie.leg1.isFinished && tie.leg1.homeScore !== null && (
                                <div className="mb-6 md:mb-8">
                                  <span className="bg-[#00e476] text-[#00210c] text-[9px] font-black px-4 md:px-5 py-1.5 md:py-2 rounded-full flex items-center gap-2 shadow-[0_4px_15px_rgba(97,255,151,0.4)] uppercase tracking-[0.2em] border border-white/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00210c] animate-pulse"></span> CANLI
                                  </span>
                                </div>
                              )}

                              <div className="relative mb-8 md:mb-10 group">
                                <div className="absolute -inset-4 bg-[#b1c6fc]/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <img alt="UCL Trophy" className="w-24 h-24 md:w-32 md:h-32 object-contain trophy-glow relative z-10 transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE0--C_u0sz9TUM_HnwI3Xh_rzq6xeeAm-YBk4ubrMj465GSiaE7hauJA0_9bMZK-HGPuUxo1gtcgrRJ0IEGy_gT6iuSMqVGyLRtL0VwYbwTVy3n8r_Em-RigwIlylHh5OA_uia7eqN_cVLvhOPF8ssJGfRmugZ6DsAfD5mMUAd7FFbnxteT9CwPUMtYEaKJNBe_GHB0f8v0iJivAuQANdzUmuVEcv_zahYUkUkGGuj3wLmGX2i-4Ns3--udnSm9mGc_ngao6KPW4"/>
                              </div>

                              <div className="w-full flex flex-col items-center gap-6">
                                <div className="w-full grid grid-cols-3 items-center gap-2">
                                  <div className="flex flex-col items-center gap-2 md:gap-3">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 p-2 md:p-3 shadow-lg border border-white/10 flex items-center justify-center">
                                      <img alt={home.name} className="w-full h-full object-contain" src={home.logo}/>
                                    </div>
                                    <h3 className="font-headline font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-center text-[#dae3f6]">{home.name}</h3>
                                  </div>
                                  
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="score-font text-3xl md:text-5xl text-white flex items-center gap-2 md:gap-3 leading-none">
                                      <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{homeScore ?? '-'}</span>
                                      <span className="text-sm md:text-lg text-[#b1c6fc]/30 font-medium">—</span>
                                      <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{awayScore ?? '-'}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-center gap-2 md:gap-3 opacity-80">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 p-2 md:p-3 shadow-lg border border-white/10 flex items-center justify-center">
                                      <img alt={away.name} className="w-full h-full object-contain" src={away.logo}/>
                                    </div>
                                    <h3 className="font-headline font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-center text-[#dae3f6]">{away.name}</h3>
                                  </div>
                                </div>

                                <div className="flex flex-col items-center gap-2 md:gap-3 mt-4 pt-6 border-t border-white/5 w-full">
                                  <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.5em] text-[#b1c6fc] font-black">UEFA CHAMPIONS LEAGUE</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const { dateStr, timeStr } = getMatchDateTime(tie.leg1.id, 0, tie.leg1.isFinished);
                    
                    return (
                      <div key={tie.leg1.id} className="relative w-full group cursor-pointer" onClick={() => onMatchClick(tie.leg1.id)}>
                        <div className={`absolute ${col.isLeftSide ? '-right-12 lg:-right-24' : '-left-12 lg:-left-24'} top-1/2 w-12 lg:w-24 h-[1px] connector-line opacity-50`}></div>
                        
                        <div className="flex flex-col gap-1 mb-1 px-2">
                           <span className="text-[7px] md:text-[9px] font-black text-[#b1c6fc]/40 uppercase tracking-widest">{dateStr} • {timeStr}</span>
                        </div>

                        <div className="glass-card p-3 md:p-5 rounded-2xl transition-all duration-500 group-hover:border-[#b1c6fc]/40 group-hover:bg-[#1e293b]/70 relative overflow-hidden">
                          {/* Aggregate Score Badge */}
                          {(tie.leg1.homeScore !== null && tie.leg2 && tie.leg2.homeScore !== null) && (
                            <div className="absolute top-0 right-0 bg-[#b1c6fc]/10 px-2 py-1 rounded-bl-xl border-l border-b border-white/5">
                              <span className="text-[7px] md:text-[9px] font-black text-[#61ff97] uppercase tracking-tighter">ÜMUMİ: {homeScore}-{awayScore}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center mb-3 md:mb-5">
                            {tie.leg1.isFinished ? (
                              <span className="bg-[#1c2533]/50 text-[#c5c6d0] text-[7px] md:text-[8px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full uppercase border border-white/10">BİTİB</span>
                            ) : tie.leg1.homeScore !== null ? (
                              <span className="bg-[#93000a]/20 text-[#ffb4ab] text-[7px] md:text-[8px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1.5 border border-[#ffb4ab]/20">
                                <span className="w-1 h-1 rounded-full bg-[#ffb4ab] animate-pulse"></span> CANLI
                              </span>
                            ) : (
                              <span className="bg-[#1c2533]/50 text-[#c5c6d0] text-[7px] md:text-[8px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full uppercase border border-white/10">GÖZLƏNİLİR</span>
                            )}
                          </div>
                          
                          <div className="space-y-3 md:space-y-5">
                            <div className={`flex justify-between items-center ${homeScore !== null && awayScore !== null && homeScore < awayScore ? 'opacity-50' : ''}`}>
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-white/5 p-1 md:p-1.5 border border-white/10 shadow-inner">
                                  <img alt={home.name} className="w-full h-full object-contain" src={home.logo}/>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-headline font-bold text-[9px] md:text-xs uppercase tracking-wide">{home.name}</span>
                                  {tie.leg2 && (
                                    <span className="text-[6px] md:text-[8px] text-white/30 font-medium">1-ci: {tie.leg1.homeScore} | 2-ci: {tie.leg2.awayScore}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`font-headline text-base md:text-2xl font-black ${homeScore !== null && homeScore > (awayScore || 0) ? 'text-[#61ff97]' : ''}`}>{homeScore ?? '-'}</span>
                            </div>
                            
                            <div className={`flex justify-between items-center ${homeScore !== null && awayScore !== null && awayScore < homeScore ? 'opacity-50' : ''}`}>
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-white/5 p-1 md:p-1.5 border border-white/10 shadow-inner">
                                  <img alt={away.name} className="w-full h-full object-contain" src={away.logo}/>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-headline font-bold text-[9px] md:text-xs uppercase tracking-wide">{away.name}</span>
                                  {tie.leg2 && (
                                    <span className="text-[6px] md:text-[8px] text-white/30 font-medium">1-ci: {tie.leg1.awayScore} | 2-ci: {tie.leg2.homeScore}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`font-headline text-base md:text-2xl font-black ${awayScore !== null && awayScore > (homeScore || 0) ? 'text-[#61ff97]' : ''}`}>{awayScore ?? '-'}</span>
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
            </div>
          </section>
          )}

          {/* Match Calendar Section */}
          {allCalendarMatches.length > 0 && (
            <section className="mt-20 md:mt-40 w-full animate-in slide-in-from-bottom-10 duration-700 delay-300">
              <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-[#b1c6fc] rounded-full shadow-[0_0_20px_rgba(177,198,252,0.6)]"></div>
                  <h2 className="font-headline text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">OYUNLAR TƏQVİMİ</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allCalendarMatches.map((match, idx) => {
                const home = getTeam(match.homeTeamId);
                const away = getTeam(match.awayTeamId);
                const { dateStr, timeStr } = getMatchDateTime(match.id, idx, match.isFinished);

                return (
                  <div key={match.id} onClick={() => onMatchClick(match.id)} className="glass-card p-4 md:p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.05] transition-all border border-white/5 relative overflow-hidden">
                    {match.isFinished && (
                      <div className="absolute top-0 right-0 bg-white/5 px-2 py-0.5 rounded-bl-lg">
                        <span className="text-[6px] font-black text-white/20 uppercase">KEÇMİŞ</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2 md:gap-4 w-1/3">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 p-2 border border-white/10 shadow-lg group-hover:border-[#b1c6fc]/30 transition-colors">
                        <img alt={home.name} className="w-full h-full object-contain" src={home.logo}/>
                      </div>
                      <span className="font-label text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#dae3f6]/60 text-center truncate w-full">{home.name}</span>
                    </div>
                    <div className="flex flex-col items-center w-1/3">
                      {match.isFinished ? (
                        <span className="font-headline text-lg md:text-2xl font-black text-[#dae3f6]">{match.homeScore} : {match.awayScore}</span>
                      ) : (
                        <span className="font-headline text-[10px] md:text-sm font-black text-[#b1c6fc] tracking-widest">{timeStr}</span>
                      )}
                      <span className="font-label text-[7px] md:text-[9px] text-[#c5c6d0]/40 uppercase mt-1 md:mt-2 font-bold tracking-widest">{dateStr}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 md:gap-4 w-1/3">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/5 p-2 border border-white/10 shadow-lg group-hover:border-[#b1c6fc]/30 transition-colors">
                        <img alt={away.name} className="w-full h-full object-contain" src={away.logo}/>
                      </div>
                      <span className="font-label text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#dae3f6]/60 text-center truncate w-full">{away.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </main>
      
      {/* Bottom aesthetic gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-10"></div>
    </div>
  );
};

export default UclKnockoutView;
