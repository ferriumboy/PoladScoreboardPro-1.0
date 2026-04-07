
import React, { useState } from 'react';
import { Team, TournamentMode, TournamentType, SavedTournament } from '../types';
import { allFootballClubs, ClubData, teamLogos } from '../data/clubs';
import { getCountryTeams, countryFlags } from '../data/countries';
import HistoryDetails from './HistoryDetails';

interface Props {
  onStart: (teams: Team[], mode: TournamentMode, type: TournamentType, managerName: string) => void;
  onResume: () => void;
  initialTeams: Team[];
  initialType: TournamentType;
  initialMode: TournamentMode;
  hasExistingTournament: boolean;
  history: SavedTournament[];
  isMuted: boolean;
  onToggleMute: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onOpenSocialFeed: () => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const TournamentSetup: React.FC<Props> = ({ onStart, onResume, initialTeams, initialType, initialMode, hasExistingTournament, history, isMuted, onToggleMute, zoomLevel, onZoomChange, onOpenSocialFeed }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams.length > 0 ? initialTeams : [
    { id: '1', name: 'Qarabağ FK', logo: teamLogos["Qarabağ FK"] || DEFAULT_LOGO },
    { id: '2', name: 'Barcelona', logo: teamLogos["Barcelona"] || DEFAULT_LOGO }
  ]);
  const [clubTeams, setClubTeams] = useState<Team[]>(initialType === TournamentType.WORLD_CUP ? [] : (initialTeams.length > 0 ? initialTeams : [
    { id: '1', name: 'Qarabağ FK', logo: teamLogos["Qarabağ FK"] || DEFAULT_LOGO },
    { id: '2', name: 'Barcelona', logo: teamLogos["Barcelona"] || DEFAULT_LOGO }
  ]));
  const [countryTeams, setCountryTeams] = useState<Team[]>(initialType === TournamentType.WORLD_CUP ? initialTeams : []);
  const [mode, setMode] = useState<TournamentMode>(initialMode);
  const [type, setType] = useState<TournamentType>(initialType);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingTournament, setViewingTournament] = useState<SavedTournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTeamIdForSelection, setActiveTeamIdForSelection] = useState<string | null>(null);
  const [tempLeague, setTempLeague] = useState("");
  const [tempTeam, setTempTeam] = useState<ClubData | null>(null);

  const addTeam = () => {
    const newId = Date.now().toString();
    setTeams([...teams, { id: newId, name: `Komanda ${teams.length + 1}`, logo: DEFAULT_LOGO }]);
  };

  const removeTeam = (id: string) => {
    if (teams.length <= 2) return;
    setTeams(teams.filter(t => t.id !== id));
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleNameChange = (id: string, name: string) => {
    let newLogo = DEFAULT_LOGO;
    const trimmed = name.trim();
    if (type === TournamentType.WORLD_CUP) {
      if (countryFlags[trimmed]) {
        newLogo = countryFlags[trimmed];
      }
    } else {
      if (teamLogos[trimmed]) {
        newLogo = teamLogos[trimmed];
      }
    }
    updateTeam(id, { name, logo: newLogo });
  };

  const handleLogoUpload = (id: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateTeam(id, { logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleClubSelectionFinish = () => {
    if (activeTeamIdForSelection && tempTeam) {
      updateTeam(activeTeamIdForSelection, { name: tempTeam.name, logo: tempTeam.logo });
      setActiveTeamIdForSelection(null);
      setTempLeague("");
      setTempTeam(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(teams, mode, type, "Baş məşqçi");
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen flex flex-col z-10 animate-in fade-in duration-700">
      <nav className="w-full px-4 py-4 md:px-6 md:py-5 flex items-center justify-between bg-[#020412]/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative bg-[#0a0f29] border border-[#00ff88]/20 p-1.5 md:p-2 rounded-lg shadow-lg">
            <span className="material-icons text-[#00ff88] text-lg md:text-xl">sports_soccer</span>
          </div>
          <div className="font-black text-lg md:text-xl tracking-tight italic text-white">
            FUTBOL<span className="text-[#00ff88] logo-glow">PRO</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
              title="Kiçilt"
            >
              <span className="material-symbols-outlined text-sm md:text-lg">zoom_out</span>
            </button>
            <span className="text-[10px] md:text-xs font-black text-white w-8 md:w-12 text-center">{zoomLevel}%</span>
            <button 
              onClick={() => onZoomChange(Math.min(150, zoomLevel + 10))}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
              title="Böyüt"
            >
              <span className="material-symbols-outlined text-sm md:text-lg">zoom_in</span>
            </button>
          </div>
          <button onClick={onToggleMute} className="w-9 h-9 md:w-10 md:h-10 bg-white/5 border border-white/10 rounded-xl text-white flex items-center justify-center">
            <span className="material-icons text-lg md:text-2xl">{isMuted ? 'volume_off' : 'volume_up'}</span>
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1.5 md:px-5 md:py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] md:text-xs font-bold text-white/80">
            TARİXÇƏ
          </button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center p-1 md:p-4 gap-2 md:gap-6 max-w-4xl mx-auto w-full transform scale-[0.85] origin-top md:scale-100">
        {showHistory ? (
          <div className="glass-panel w-full p-2 md:p-10 rounded-xl md:rounded-3xl relative overflow-hidden border border-white/5 bg-[#010412]/80 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 md:mb-8">
              <div>
                <h1 className="text-xl md:text-4xl font-black text-white italic tracking-tighter uppercase">
                  TURNİR <span className="text-[#00ff88] logo-glow">TARİXÇƏSİ</span>
                </h1>
                <p className="text-slate-400 text-[8px] md:text-xs font-bold tracking-[0.2em] uppercase opacity-60">
                  Keçmiş turnirlərin nəticələri
                </p>
              </div>
              <button 
                onClick={() => viewingTournament ? setViewingTournament(null) : setShowHistory(false)} 
                className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white hover:bg-white/10 transition-all self-start md:self-auto"
              >
                <span className="material-icons text-xs">arrow_back</span> GERİ
              </button>
            </div>

            {!viewingTournament && (
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-slate-500 text-lg">search</span>
                <input 
                  type="text" 
                  placeholder="Turnir adı və ya tarix ilə axtar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 outline-none focus:border-[#00ff88]/40 transition-all text-sm font-medium"
                />
              </div>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {viewingTournament ? (
                <HistoryDetails 
                  tournament={viewingTournament} 
                  onBack={() => setViewingTournament(null)} 
                />
              ) : (filteredHistory || []).length > 0 ? (
                (filteredHistory || []).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setViewingTournament(item)}
                    className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#00ff88]/20 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase italic">{item.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.date}</p>
                      </div>
                      <div className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
                        <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest">
                          {item.type === TournamentType.CHAMPIONS_LEAGUE ? 'UCL' : 'Dünya Kuboku'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {(item.standings || []).slice(0, 4).map((s, idx) => (
                        <div key={s.teamId} className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl border border-white/5 min-w-fit">
                          <span className="text-[10px] font-black text-slate-500">{idx + 1}.</span>
                          <img src={s.teamLogo} className="w-5 h-5 object-contain" alt="" />
                          <span className="text-[10px] font-bold text-white/80 uppercase truncate max-w-[80px]">{s.teamName}</span>
                          <span className="text-[10px] font-black text-[#00ff88]">{s.pts} P</span>
                        </div>
                      ))}
                      {(item.standings || []).length > 4 && (
                        <div className="text-[10px] font-bold text-slate-500 px-2">+{(item.standings || []).length - 4} daha</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <span className="material-icons text-slate-700 text-5xl mb-4">history_toggle_off</span>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Heç bir nəticə tapılmadı</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel w-full p-2 md:p-10 rounded-xl md:rounded-3xl relative overflow-hidden border border-white/5 bg-[#010412]/80 shadow-2xl">
            {hasExistingTournament && (
              <div className="mb-4 p-2 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-[#00ff88] font-black text-[8px] uppercase italic">Davam edən turnir var</h3>
                  <p className="text-slate-400 text-[6px] font-medium">Son qaldığın yerdən davam edə bilərsən</p>
                </div>
                <button 
                  onClick={onResume}
                  className="px-3 py-1 bg-[#00ff88] text-[#010412] font-black text-[8px] uppercase rounded-lg shadow-lg shadow-[#00ff88]/20 active:scale-95 transition-all"
                >
                  DAVAM ET
                </button>
              </div>
            )}
            <div className="text-center mb-4 md:mb-10">
              <h1 className="text-xl md:text-5xl font-black text-white mb-1 italic tracking-tighter uppercase">
                YENİ <span className="text-[#00ff88] logo-glow">TURNİR</span>
              </h1>
              <p className="text-slate-400 text-[8px] md:text-xs font-bold tracking-[0.2em] uppercase opacity-60">
                Komandaları daxil et və püşkatmaya başla
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-8">
              <div className="space-y-2 md:space-y-4 max-h-[250px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                {(teams || []).map((team) => (
                  <div key={team.id} className="flex flex-col gap-1 p-2 md:p-4 bg-black/40 rounded-xl border border-white/5 hover:border-[#00ff88]/30 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-shrink-0 w-8 h-8 md:w-14 md:h-14 rounded-lg bg-white flex items-center justify-center p-1 shadow-xl">
                        <img src={team.logo} onError={(e) => (e.currentTarget.src = DEFAULT_LOGO)} className="w-full h-full object-contain" alt="" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 rounded-lg cursor-pointer">
                            <span className="material-icons text-white text-xs">photo_camera</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(team.id, e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <div className="flex-grow flex items-center gap-1">
                        <input 
                          type="text" 
                          value={team.name}
                          onChange={(e) => handleNameChange(team.id, e.target.value)}
                          className="w-full bg-black/40 text-white px-2 py-2 md:py-4 rounded-lg border border-white/5 outline-none focus:border-[#00ff88]/30 font-black text-[10px] md:text-lg uppercase italic" 
                          placeholder="Komanda..." 
                        />
                        <button 
                          type="button" 
                          onClick={() => setActiveTeamIdForSelection(activeTeamIdForSelection === team.id ? null : team.id)} 
                          className={`p-2 md:p-4 rounded-lg border transition-all ${activeTeamIdForSelection === team.id ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'text-emerald-400 bg-white/5 border-emerald-500/20'}`}
                        >
                           <span className="material-icons text-xs">list</span>
                        </button>
                      </div>
                      {(teams || []).length > 2 && (
                        <button type="button" onClick={() => removeTeam(team.id)} className="p-1 text-red-500/40 hover:text-red-500">
                           <span className="material-icons text-xs">delete</span>
                        </button>
                      )}
                    </div>

                    {activeTeamIdForSelection === team.id && (
                      <div className="mt-2 p-3 bg-black/60 rounded-xl border border-[#00ff88]/20 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <select 
                            value={tempLeague} 
                            onChange={(e) => { setTempLeague(e.target.value); setTempTeam(null); }} 
                            className="bg-[#0a0f29] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#00ff88]"
                          >
                            <option value="">-- {type === TournamentType.WORLD_CUP ? 'Ölkə' : 'Liqa'} Seçin --</option>
                            {type === TournamentType.WORLD_CUP ? (
                              <option value="WORLD_CUP_COUNTRIES">🌍 Dünya Kuboku (Ölkələr)</option>
                            ) : (
                              Object.keys(allFootballClubs || {}).map((l, i) => <option key={`league-${l}-${i}`} value={l}>{l}</option>)
                            )}
                          </select>
                          <select 
                            onChange={(e) => {
                              let club;
                              if (tempLeague === "WORLD_CUP_COUNTRIES") {
                                club = getCountryTeams().find(c => c.name === e.target.value);
                              } else {
                                club = allFootballClubs[tempLeague]?.find(c => c.name === e.target.value);
                              }
                              if (club) setTempTeam(club);
                            }} 
                            disabled={!tempLeague} 
                            className="bg-[#0a0f29] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-[#00ff88] disabled:opacity-30"
                          >
                            <option value="">-- Komanda Seçin --</option>
                            {tempLeague === "WORLD_CUP_COUNTRIES" ? (
                              getCountryTeams().map((t, i) => <option key={`country-${t.name}-${i}`} value={t.name}>{t.name}</option>)
                            ) : (
                              tempLeague && (allFootballClubs[tempLeague] || []).map((t, i) => <option key={`club-${t.name}-${i}`} value={t.name}>{t.name}</option>)
                            )}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setActiveTeamIdForSelection(null)} className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500">Ləğv Et</button>
                          <button 
                            type="button" 
                            onClick={handleClubSelectionFinish} 
                            disabled={!tempTeam} 
                            className="px-5 py-1.5 bg-[#00ff88] text-[#010412] text-[10px] font-black uppercase rounded-lg disabled:opacity-50"
                          >
                            Təsdiqlə
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <button type="button" onClick={addTeam} className="w-full py-2 rounded-xl border-2 border-dashed border-white/10 text-slate-500 hover:text-white uppercase font-black text-[8px] tracking-widest">
                  + Komanda Əlavə Et
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Turnir Tipi</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                      type="button"
                      onClick={() => {
                        if (type === TournamentType.WORLD_CUP) {
                          setCountryTeams(teams);
                          setTeams(clubTeams.length > 0 ? clubTeams : [
                            { id: '1', name: 'Qarabağ FK', logo: teamLogos["Qarabağ FK"] || DEFAULT_LOGO },
                            { id: '2', name: 'Barcelona', logo: teamLogos["Barcelona"] || DEFAULT_LOGO }
                          ]);
                        }
                        setType(TournamentType.CHAMPIONS_LEAGUE);
                        setTempLeague("");
                        setActiveTeamIdForSelection(null);
                        if (mode === TournamentMode.GROUP_KNOCKOUT) setMode(TournamentMode.LEAGUE_KNOCKOUT);
                      }}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${type === TournamentType.CHAMPIONS_LEAGUE ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      UCL
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (type === TournamentType.CHAMPIONS_LEAGUE) {
                          setClubTeams(teams);
                          setTeams(countryTeams.length > 0 ? countryTeams : [
                            { id: 'country-1', name: 'Azərbaycan', logo: countryFlags['Azərbaycan'] || DEFAULT_LOGO },
                            { id: 'country-2', name: 'Türkiyə', logo: countryFlags['Türkiyə'] || DEFAULT_LOGO }
                          ]);
                        }
                        setType(TournamentType.WORLD_CUP);
                        setTempLeague("");
                        setActiveTeamIdForSelection(null);
                        if (mode === TournamentMode.LEAGUE_KNOCKOUT) setMode(TournamentMode.GROUP_KNOCKOUT);
                      }}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${type === TournamentType.WORLD_CUP ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      Dünya Kuboku
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Oyun Formatı</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {type === TournamentType.CHAMPIONS_LEAGUE ? (
                      <>
                        <button 
                          type="button"
                          onClick={() => setMode(TournamentMode.LEAGUE_KNOCKOUT)}
                          className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === TournamentMode.LEAGUE_KNOCKOUT ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                        >
                          Liqa + Pley-off
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMode(TournamentMode.LEAGUE)}
                          className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === TournamentMode.LEAGUE ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                        >
                          Liqa
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setMode(TournamentMode.GROUP_KNOCKOUT)}
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === TournamentMode.GROUP_KNOCKOUT ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                      >
                        Qrup + Pley-off
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setMode(TournamentMode.KNOCKOUT)}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === TournamentMode.KNOCKOUT ? 'bg-[#00ff88] text-[#010412] shadow-lg shadow-[#00ff88]/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      Pley-off
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 md:py-6 btn-gradient text-[#020412] font-black text-[10px] md:text-sm tracking-widest uppercase rounded-xl md:rounded-2xl shadow-2xl active:scale-95 transition-transform">
                PÜŞKATMAYA BAŞLA
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentSetup;
