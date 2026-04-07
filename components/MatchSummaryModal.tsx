import React, { useState, useEffect, useRef } from 'react';
import { Match, Team } from '../types';
import { globalPlayers } from '../data/players';

interface Props {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  teamPlayers: Record<string, string[]>;
  aggregateText?: string;
  onUpdate: (details: Partial<Match>) => void;
  onClose: () => void;
  zoomLevel?: number;
  onZoomChange?: (level: number) => void;
}

const MatchSummaryModal: React.FC<Props> = ({ match, homeTeam, awayTeam, teamPlayers, aggregateText, onUpdate, onClose, zoomLevel = 100, onZoomChange }) => {
  const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

  const [localMatch, setLocalMatch] = useState<Partial<Match>>({
    homeScorers: match.homeScorers || [],
    awayScorers: match.awayScorers || [],
    homeAssists: match.homeAssists || [],
    awayAssists: match.awayAssists || [],
    homeYellowCards: match.homeYellowCards || [],
    awayYellowCards: match.awayYellowCards || [],
    homeRedCards: match.homeRedCards || [],
    awayRedCards: match.awayRedCards || [],
    mvp: match.mvp || ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLocalUpdate = (updates: Partial<Match>) => {
    setLocalMatch(prev => {
      const next = { ...prev, ...updates };
      if (updateTimer.current) clearTimeout(updateTimer.current);
      updateTimer.current = setTimeout(() => {
        onUpdate(next);
      }, 500);
      return next;
    });
  };

  const handleScorerChange = (side: 'home' | 'away', idx: number, val: string) => {
    const scorers = side === 'home' ? [...(localMatch.homeScorers || [])] : [...(localMatch.awayScorers || [])];
    scorers[idx] = val;
    handleLocalUpdate(side === 'home' ? { homeScorers: scorers } : { awayScorers: scorers });
  };

  const handleAssistChange = (side: 'home' | 'away', idx: number, val: string) => {
    const assists = side === 'home' ? [...(localMatch.homeAssists || [])] : [...(localMatch.awayAssists || [])];
    assists[idx] = val;
    handleLocalUpdate(side === 'home' ? { homeAssists: assists } : { awayAssists: assists });
  };

  const handleYellowCardChange = (side: 'home' | 'away', idx: number, val: string) => {
    const cards = side === 'home' ? [...(localMatch.homeYellowCards || [])] : [...(localMatch.awayYellowCards || [])];
    cards[idx] = val;
    handleLocalUpdate(side === 'home' ? { homeYellowCards: cards } : { awayYellowCards: cards });
  };

  const handleRedCardChange = (side: 'home' | 'away', idx: number, val: string) => {
    const cards = side === 'home' ? [...(localMatch.homeRedCards || [])] : [...(localMatch.awayRedCards || [])];
    cards[idx] = val;
    handleLocalUpdate(side === 'home' ? { homeRedCards: cards } : { awayRedCards: cards });
  };

  const mvpTeam = localMatch.mvp && (localMatch.homeScorers?.includes(localMatch.mvp) || localMatch.homeAssists?.includes(localMatch.mvp) || localMatch.homeYellowCards?.includes(localMatch.mvp) || localMatch.homeRedCards?.includes(localMatch.mvp)) ? homeTeam : 
                  localMatch.mvp && (localMatch.awayScorers?.includes(localMatch.mvp) || localMatch.awayAssists?.includes(localMatch.mvp) || localMatch.awayYellowCards?.includes(localMatch.mvp) || localMatch.awayRedCards?.includes(localMatch.mvp)) ? awayTeam : null;

  // Let's just assume MVP is from home team if not found, or user can just type it.
  // Actually, we can just show the logo if we know the team.
  // A better way is to check which team's players list has the MVP.
  // For simplicity, we can just show a generic logo or try to guess.
  const getMvpLogo = () => {
    if (!localMatch.mvp) return null;
    
    // User wants the winning team's logo to be displayed for MVP
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;
    
    if (homeScore > awayScore) return homeTeam.logo;
    if (awayScore > homeScore) return awayTeam.logo;
    
    // If it's a draw, fallback to the player's team logo
    if (localMatch.homeScorers?.includes(localMatch.mvp) || localMatch.homeAssists?.includes(localMatch.mvp) || localMatch.homeYellowCards?.includes(localMatch.mvp) || localMatch.homeRedCards?.includes(localMatch.mvp)) return homeTeam.logo;
    if (localMatch.awayScorers?.includes(localMatch.mvp) || localMatch.awayAssists?.includes(localMatch.mvp) || localMatch.awayRedCards?.includes(localMatch.mvp)) return awayTeam.logo;
    
    // Check teamPlayers state
    if (teamPlayers[homeTeam.id]?.includes(localMatch.mvp)) return homeTeam.logo;
    if (teamPlayers[awayTeam.id]?.includes(localMatch.mvp)) return awayTeam.logo;

    return null; // fallback
  };

  const mvpLogo = getMvpLogo();

  const savedPlayersStr = localStorage.getItem("savedCustomPlayers");
  const savedPlayers: string[] = savedPlayersStr ? JSON.parse(savedPlayersStr) : [];

  const allAvailablePlayers = React.useMemo(() => {
    return [...new Set([
      ...globalPlayers,
      ...savedPlayers,
      ...Object.values(teamPlayers || {}).flat()
    ])].sort();
  }, [teamPlayers, savedPlayersStr]);

  const filteredPlayers = React.useMemo(() => {
    if (!searchQuery) {
      // Show team players first if no search query
      const teamPlayersList = [...new Set(Object.values(teamPlayers || {}).flat())].sort();
      return teamPlayersList.slice(0, 100);
    }
    const lowerQuery = searchQuery.toLowerCase();
    return allAvailablePlayers
      .filter(p => p.toLowerCase().includes(lowerQuery))
      .slice(0, 100);
  }, [allAvailablePlayers, searchQuery, teamPlayers]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 md:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-4xl rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10 relative max-h-[95vh] md:max-h-[90vh]">
        
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
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
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Left Side: Match Context & MVP */}
        <div className="w-full md:w-2/5 p-4 md:p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between bg-white/5 overflow-y-auto shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-primary text-sm" data-icon="sports_soccer">sports_soccer</span>
              </div>
              <span className="font-headline font-extrabold tracking-widest text-xs uppercase text-on-primary-container">Oyunun Özətləri</span>
            </div>
            
            <div className="space-y-1 mb-4 md:mb-8">
              <h1 className="font-headline text-2xl md:text-4xl font-extrabold tracking-tighter text-white">Match Centre</h1>
              <p className="text-on-surface-variant font-medium text-xs md:text-base italic">{match.stageName || 'UEFA Champions League'}</p>
            </div>

            {/* MVP / MATÇIN ADAMI SECTION */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary-fixed/20 to-primary-fixed/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-surface-container-highest/40 border border-secondary-fixed/20 p-4 md:p-6 rounded-2xl hero-glow">
                <span className="inline-block px-2 py-1 rounded-full bg-secondary-container/10 text-secondary-fixed text-[8px] md:text-[10px] font-bold tracking-widest uppercase mb-3 border border-secondary-fixed/20">Matçın Adamı</span>
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 border-secondary-fixed bg-surface-container-lowest p-1.5 md:p-2">
                      <img alt="MVP Team Logo" className="w-full h-full object-contain rounded-full" src={mvpLogo || DEFAULT_LOGO}/>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-secondary-fixed text-on-secondary-fixed rounded-full p-1 shadow-lg">
                      <span className="material-symbols-outlined text-[12px] md:text-[14px] block" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input 
                      list="all-players-modal" 
                      value={localMatch.mvp || ''} 
                      onFocus={(e) => setSearchQuery(e.target.value)}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleLocalUpdate({ mvp: e.target.value });
                      }} 
                      className="w-full bg-transparent border-b border-white/20 focus:border-secondary-fixed text-lg md:text-xl font-bold text-white leading-tight outline-none placeholder-white/30 truncate" 
                      placeholder="Oyunçu adı..." 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center flex-1">
                <span className="block font-headline text-2xl md:text-4xl font-black text-white">{match.homeScore ?? '-'}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant tracking-widest uppercase truncate block w-full px-1">{homeTeam.name.substring(0, 3)}</span>
              </div>
              <div className="h-6 md:h-8 w-px bg-white/10"></div>
              <div className="text-center flex-1">
                <span className="block font-headline text-2xl md:text-4xl font-black text-white/40">{match.awayScore ?? '-'}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-on-surface-variant tracking-widest uppercase opacity-40 truncate block w-full px-1">{awayTeam.name.substring(0, 3)}</span>
              </div>
            </div>
            {aggregateText && (
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-full text-secondary-fixed text-[10px] font-black uppercase tracking-widest">
                  {aggregateText}
                </span>
              </div>
            )}
            <div className="flex justify-center mt-2">
              <button onClick={onClose} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase border border-white/10 transition-all active:scale-95">
                Statistikalar
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Events */}
        <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-surface-container/50">
          <div className="grid grid-cols-1 gap-12">
            
            {/* Qolun Müəllifi */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-secondary-fixed" data-icon="sports_soccer">sports_soccer</span>
                <h2 className="font-headline text-xs font-extrabold tracking-[0.2em] uppercase text-white/60">Qolun Müəllifi</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-2">{homeTeam.name}</h3>
                    {Array.from({ length: Math.max(0, match.homeScore || 0) }).map((_, i) => (
                      <div key={`home-scorer-${i}`} className="flex items-center justify-between group mb-2">
                        <input 
                          list="all-players-modal" 
                          value={localMatch.homeScorers?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleScorerChange('home', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-secondary-fixed text-sm text-white font-bold outline-none placeholder-white/20" 
                          placeholder="Oyunçu adı..." 
                        />
                        <span className="material-symbols-outlined text-secondary-fixed text-sm ml-2" data-icon="sports_soccer" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>sports_soccer</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-2 text-right">{awayTeam.name}</h3>
                    {Array.from({ length: Math.max(0, match.awayScore || 0) }).map((_, i) => (
                      <div key={`away-scorer-${i}`} className="flex items-center justify-between group mb-2">
                        <span className="material-symbols-outlined text-secondary-fixed text-sm mr-2" data-icon="sports_soccer" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>sports_soccer</span>
                        <input 
                          list="all-players-modal" 
                          value={localMatch.awayScorers?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleScorerChange('away', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-secondary-fixed text-sm text-white font-bold outline-none text-right placeholder-white/20" 
                          placeholder="Oyunçu adı..." 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Asist */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" data-icon="conversion_path">conversion_path</span>
                <h2 className="font-headline text-xs font-extrabold tracking-[0.2em] uppercase text-white/60">Asist</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {Array.from({ length: Math.max(0, match.homeScore || 0) }).map((_, i) => (
                      <div key={`home-assist-${i}`} className="flex items-center justify-between mb-2">
                        <input 
                          list="all-players-modal" 
                          value={localMatch.homeAssists?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleAssistChange('home', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-primary text-sm text-white/80 font-bold outline-none placeholder-white/20" 
                          placeholder="Asist edən..." 
                        />
                        <span className="material-symbols-outlined text-primary text-sm ml-2" data-icon="assistant_navigation">assistant_navigation</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {Array.from({ length: Math.max(0, match.awayScore || 0) }).map((_, i) => (
                      <div key={`away-assist-${i}`} className="flex items-center justify-between mb-2">
                        <span className="material-symbols-outlined text-primary text-sm mr-2" data-icon="assistant_navigation">assistant_navigation</span>
                        <input 
                          list="all-players-modal" 
                          value={localMatch.awayAssists?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleAssistChange('away', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-primary text-sm text-white/80 font-bold outline-none text-right placeholder-white/20" 
                          placeholder="Asist edən..." 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Cards Section */}
            <div className="space-y-12">
              {/* Sarı Vərəqələr */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-4 bg-yellow-400 rounded-sm shadow-[0_0_10px_rgba(250,204,21,0.4)]"></div>
                  <h2 className="font-headline text-xs font-extrabold tracking-[0.2em] uppercase text-white/60">Sarı Vərəqələr</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-3">{homeTeam.name}</h3>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(3, (localMatch.homeYellowCards?.filter(Boolean).length || 0) + 1) }).map((_, i) => (
                        <input 
                          key={`home-yellow-${i}`} 
                          list="all-players-modal" 
                          value={localMatch.homeYellowCards?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleYellowCardChange('home', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-yellow-400 text-xs md:text-sm text-white/90 font-semibold outline-none placeholder-white/10" 
                          placeholder="Oyunçu adı..." 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-3 text-right">{awayTeam.name}</h3>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(3, (localMatch.awayYellowCards?.filter(Boolean).length || 0) + 1) }).map((_, i) => (
                        <input 
                          key={`away-yellow-${i}`} 
                          list="all-players-modal" 
                          value={localMatch.awayYellowCards?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleYellowCardChange('away', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-yellow-400 text-xs md:text-sm text-white/90 font-semibold outline-none text-right placeholder-white/10" 
                          placeholder="Oyunçu adı..." 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Qırmızı Vərəqələr */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-4 bg-error rounded-sm shadow-[0_0_10px_rgba(255,180,171,0.4)]"></div>
                  <h2 className="font-headline text-xs font-extrabold tracking-[0.2em] uppercase text-white/60">Qırmızı Vərəqələr</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-3">{homeTeam.name}</h3>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(3, (localMatch.homeRedCards?.filter(Boolean).length || 0) + 1) }).map((_, i) => (
                        <input 
                          key={`home-red-${i}`} 
                          list="all-players-modal" 
                          value={localMatch.homeRedCards?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleRedCardChange('home', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-error text-xs md:text-sm text-white/90 font-semibold outline-none placeholder-white/10" 
                          placeholder="Oyunçu adı..." 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase mb-3 text-right">{awayTeam.name}</h3>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(3, (localMatch.awayRedCards?.filter(Boolean).length || 0) + 1) }).map((_, i) => (
                        <input 
                          key={`away-red-${i}`} 
                          list="all-players-modal" 
                          value={localMatch.awayRedCards?.[i] || ''} 
                          onFocus={(e) => setSearchQuery(e.target.value)}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleRedCardChange('away', i, e.target.value);
                          }} 
                          className="w-full bg-transparent border-b border-white/10 focus:border-error text-xs md:text-sm text-white/90 font-semibold outline-none text-right placeholder-white/10" 
                          placeholder="Oyunçu adı..." 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
      <datalist id="all-players-modal">
        {filteredPlayers.map((p, i) => <option key={`all-player-modal-${p}-${i}`} value={p} />)}
      </datalist>
    </div>
  );
};

export default MatchSummaryModal;
