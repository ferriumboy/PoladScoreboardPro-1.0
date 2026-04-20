
import React, { useState } from 'react';
import { Team, TournamentMode, TournamentType, SavedTournament } from '../types';
import { allFootballClubs, ClubData, teamLogos } from '../data/clubs';
import { getCountryTeams, countryFlags } from '../data/countries';
import HistoryDetails from './HistoryDetails';
import { auth } from '../firebase';

import UserProfileDropdown from './UserProfileDropdown';

interface Props {
  onStart: (teams: Team[], mode: TournamentMode, type: TournamentType, managerName: string, allowViewerEdit: boolean) => void;
  onJoin: (pin: string) => void;
  onResume: () => void;
  initialTeams: Team[];
  initialType: TournamentType;
  initialMode: TournamentMode;
  hasExistingTournament: boolean;
  history: SavedTournament[];
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSocialFeed: () => void;
  user: any;
  onLogin: () => void;
  isLoggingIn?: boolean;
  favoriteTeam?: Team | null;
  onSelectProfileView: (view: any) => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const TournamentSetup: React.FC<Props> = ({ 
  onStart, 
  onJoin, 
  onResume, 
  initialTeams, 
  initialType, 
  initialMode, 
  hasExistingTournament, 
  history, 
  isMuted, 
  onToggleMute, 
  onOpenSocialFeed, 
  user, 
  onLogin, 
  isLoggingIn = false,
  favoriteTeam, 
  onSelectProfileView 
}) => {
  const [setupMode, setSetupMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [joinPin, setJoinPin] = useState("");
  
  const getInitialTeams = () => {
    if (initialTeams.length > 0) return initialTeams;
    const defaultTeams = [
      { id: '1', name: 'Qarabağ FK', logo: teamLogos["Qarabağ FK"] || DEFAULT_LOGO },
      { id: '2', name: 'Barcelona', logo: teamLogos["Barcelona"] || DEFAULT_LOGO }
    ];
    if (favoriteTeam) {
      defaultTeams[0] = { ...favoriteTeam, id: '1' };
    }
    return defaultTeams;
  };

  const [teams, setTeams] = useState<Team[]>(getInitialTeams());
  const [clubTeams, setClubTeams] = useState<Team[]>(initialType === TournamentType.WORLD_CUP ? [] : getInitialTeams());
  const [countryTeams, setCountryTeams] = useState<Team[]>(initialType === TournamentType.WORLD_CUP ? getInitialTeams() : []);
  const [mode, setMode] = useState<TournamentMode>(initialMode);
  const [type, setType] = useState<TournamentType>(initialType);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingTournament, setViewingTournament] = useState<SavedTournament | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTeamIdForSelection, setActiveTeamIdForSelection] = useState<string | null>(null);
  const [tempLeague, setTempLeague] = useState("");
  const [tempTeam, setTempTeam] = useState<ClubData | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [allowViewerEdit, setAllowViewerEdit] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleClickCreate = () => {
    if (!user) {
      setShowLoginWarning(true);
      setTimeout(() => setShowLoginWarning(false), 3000);
      return;
    }
    setSetupMode('create');
  };

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
    if (!user) {
      alert("Zəhmət olmazsa qeydiyyatdan keçin turnir yaratmaq üçün.");
      onLogin();
      return;
    }
    setShowPermissionModal(true);
  };

  const confirmStart = () => {
    onStart(teams, mode, type, "Baş məşqçi", allowViewerEdit);
    setShowPermissionModal(false);
  };

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${setupMode !== 'menu' || showHistory ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-background text-on-background font-body flex flex-col z-10 animate-in fade-in duration-700`}>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl flex justify-between items-center px-6 py-4 shadow-none">
        <div className="flex items-center gap-2 text-xl font-headline font-extrabold tracking-tight text-white">
          <span className="material-symbols-outlined text-secondary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>sports_soccer</span>
          <span>Futbol<span className="text-secondary-fixed neon-glow">Pro</span></span>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onToggleMute} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full text-white flex items-center justify-center hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-xl">{isMuted ? 'volume_off' : 'volume_up'}</span>
          </button>
          
          <div className="relative group cursor-pointer" onClick={() => user ? setShowProfileDropdown(!showProfileDropdown) : !isLoggingIn && onLogin()}>
            <div className="w-10 h-10 rounded-full border-2 border-secondary-fixed/30 overflow-hidden active:scale-95 transition-transform">
              {isLoggingIn ? (
                <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                  <div className="w-5 h-5 border-2 border-secondary-fixed/20 border-t-secondary-fixed rounded-full animate-spin"></div>
                </div>
              ) : (
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCf_XiGbI2tJhj-Oi5oau1jNPyxXVXdKY7am-i2_-EG7p_YTJQi4gfvCIRaNSMChRLBnsAWMFFaZ-I6QEj9vjyMwyLytzbSXSz_AhFnF_xnD6W9HYX8oA8FcGZGTywBgEYiN723YqIkLydggHIg-L81T2TJ7UKrvgPlRz45r5WMXr_3h9-vAsl6NcFnf-D3Mrkz290taRdwOjZuaw-shqcogmVy8Lj6J8NVC5354V6v5hWgO_4q-csxJsGT5ifFcQLSrtXnG43ofoc"} 
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            {showProfileDropdown && user && (
              <div className="absolute top-full right-0 mt-3 pt-2">
                <UserProfileDropdown 
                  user={user} 
                  onLogout={() => auth.signOut()} 
                  onClose={() => setShowProfileDropdown(false)} 
                  onSelectView={onSelectProfileView}
                />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-fixed/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-container/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-1 md:p-4 gap-2 md:gap-6 max-w-4xl mx-auto w-full relative z-10 transition-all duration-500">
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
        ) : setupMode === 'menu' ? (
          <div className="w-full max-w-2xl space-y-12 flex flex-col items-center animate-in fade-in zoom-in duration-700">
            {/* Hero Typography */}
            <div className="text-center">
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-2 uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                MEYDAN <span className="text-secondary-fixed neon-glow">SƏNİNDİR</span>
              </h1>
              <p className="text-on-surface-variant font-label text-xs md:text-sm tracking-[0.4em] uppercase opacity-60">Peşəkar Futbol Təcrübəsi</p>
            </div>

            {/* Major Interactive Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {showLoginWarning && (
                <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-none">
                  <div className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Zəhmət olmazsa qeydiyyatdan keçin!
                  </div>
                </div>
              )}
              
              {/* Create Tournament */}
              <button 
                onClick={handleClickCreate}
                className="glass-card group ultra-shadow p-10 rounded-[2.5rem] flex flex-col items-center gap-6 active:scale-[0.98] transition-all duration-300 border border-secondary-fixed/5 hover:border-secondary-fixed/30 hover:bg-secondary-fixed/5"
              >
                <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center text-secondary-fixed group-hover:bg-secondary-fixed group-hover:text-surface transition-all duration-500 shadow-inner">
                  <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                </div>
                <div className="text-center">
                  <h3 className="font-headline text-2xl font-black tracking-wide text-white uppercase italic">TURNİR YARAT</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Admin (Host)</p>
                </div>
              </button>

              {/* Join Tournament */}
              <button 
                onClick={() => setSetupMode('join')}
                className="glass-card group ultra-shadow p-10 rounded-[2.5rem] flex flex-col items-center gap-6 active:scale-[0.98] transition-all duration-300 border border-secondary-fixed/5 hover:border-secondary-fixed/30 hover:bg-secondary-fixed/5"
              >
                <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center text-secondary-fixed group-hover:bg-secondary-fixed group-hover:text-surface transition-all duration-500 shadow-inner">
                  <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
                </div>
                <div className="text-center">
                  <h3 className="font-headline text-2xl font-black tracking-wide text-white uppercase italic">TURNİRƏ QOŞUL</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">İzləyici (Viewer)</p>
                </div>
              </button>
            </div>

            {/* Secondary CTA */}
            {hasExistingTournament && (
              <button 
                onClick={onResume}
                className="py-5 px-16 rounded-full border border-secondary-fixed/20 text-secondary-fixed font-headline font-bold text-xs tracking-[0.3em] hover:bg-secondary-fixed/10 active:scale-95 transition-all duration-300 flex items-center gap-4 bg-white/5 backdrop-blur-sm"
              >
                <span>DAVAM ET (LOKAL)</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            )}

            {/* Author Footer (Internal) */}
            <div className="pt-8 opacity-20 border-t border-white/5 w-32 flex flex-col items-center gap-2">
              <div className="h-px w-full bg-secondary-fixed/20"></div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Polad</p>
            </div>
          </div>
        ) : setupMode === 'join' ? (
          <div className="glass-panel w-full p-8 md:p-12 rounded-3xl border border-white/5 bg-[#010412]/80 shadow-2xl flex flex-col items-center gap-8 animate-in slide-in-from-right duration-500">
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">
                TURNİRƏ <span className="text-[#00ff88] logo-glow">QOŞUL</span>
              </h1>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase opacity-60">
                6 rəqəmli PIN kodu daxil edin
              </p>
            </div>

            <div className="w-full max-w-sm space-y-6">
              <input 
                type="text" 
                maxLength={6}
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-black/40 text-center text-4xl font-black tracking-[0.5em] text-[#00ff88] py-6 rounded-2xl border border-white/10 outline-none focus:border-[#00ff88]/40 transition-all"
                placeholder="000000"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setSetupMode('menu')}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest"
                >
                  GERİ
                </button>
                <button 
                  onClick={() => onJoin(joinPin)}
                  disabled={joinPin.length !== 6}
                  className="flex-[2] py-4 bg-[#00ff88] text-[#010412] font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg disabled:opacity-50"
                >
                  QOŞUL
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 md:py-8 px-4 md:px-12 w-full max-w-4xl mx-auto animate-in fade-in duration-1000 relative h-full">
            {/* Header Section */}
            <header className="text-center mb-4 md:mb-8">
              <h1 className="font-headline font-black text-3xl md:text-7xl tracking-tighter italic animate-pulse-glow neon-text uppercase">
                TURNİR QUR
              </h1>
              <div className="flex items-center justify-center gap-2 md:gap-4 mt-2 md:mt-4">
                <div className="h-[1px] w-8 md:w-12 bg-neon-green/30"></div>
                <p className="font-label text-neon-green text-[8px] md:text-xs tracking-[0.4em] md:tracking-[0.8em] uppercase font-bold">Elite Yarışma Rejimi</p>
                <div className="h-[1px] w-8 md:w-12 bg-neon-green/30"></div>
              </div>
            </header>

            {/* Main Card Setup */}
            <main className="elite-glass-card w-full rounded-[2rem] md:rounded-[3.5rem] p-4 md:p-10 relative overflow-hidden flex flex-col max-h-[75vh]">
              <button 
                onClick={() => setSetupMode('menu')}
                className="absolute top-4 left-4 z-30 p-2 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-neon-green transition-all"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </button>

              <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8 md:space-y-12">
                  {/* Section 1: Komanda Seçimi */}
                  <section>
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div className="w-1.5 h-6 bg-neon-green rounded-full shadow-[0_0_10px_#00ff84]"></div>
                      <h2 className="font-headline font-extrabold text-lg md:text-xl uppercase tracking-widest text-white italic">Komanda Seçimi</h2>
                    </div>
                    
                    <div className="space-y-3">
                      {teams.map((team) => (
                        <div key={team.id} className="flex flex-col gap-2">
                          <div className="group flex items-center justify-between bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl hover:border-neon-green/50 transition-all">
                            <div className="flex items-center gap-3 md:gap-4 flex-grow">
                              <div className="relative w-10 h-10 rounded-lg bg-neon-green/10 flex items-center justify-center border border-neon-green/20 group-hover:bg-neon-green/20 transition-colors overflow-hidden">
                                <img src={team.logo} onError={(e) => (e.currentTarget.src = DEFAULT_LOGO)} className="w-full h-full object-contain p-1" alt="" />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                                  <span className="material-symbols-outlined text-white text-xs">photo_camera</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(team.id, e.target.files?.[0] || null)} />
                                </label>
                              </div>
                              <div className="flex-grow flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={team.name}
                                  onChange={(e) => handleNameChange(team.id, e.target.value)}
                                  className="bg-transparent border-none outline-none font-label font-bold text-xs md:text-sm tracking-widest uppercase text-white w-full focus:ring-0"
                                  placeholder="Komanda Adı..."
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setActiveTeamIdForSelection(activeTeamIdForSelection === team.id ? null : team.id)} 
                                  className={`p-1.5 rounded-lg transition-all ${activeTeamIdForSelection === team.id ? 'text-neon-green' : 'text-slate-500 hover:text-neon-green'}`}
                                >
                                  <span className="material-symbols-outlined text-sm">list</span>
                                </button>
                              </div>
                            </div>
                            {teams.length > 2 && (
                              <button type="button" onClick={() => removeTeam(team.id)} className="ml-2 text-rose-500/40 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            )}
                          </div>

                          {activeTeamIdForSelection === team.id && (
                            <div className="p-3 bg-surface-dark/80 border border-neon-green/20 rounded-xl animate-in slide-in-from-top-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                <select 
                                  value={tempLeague} 
                                  onChange={(e) => { setTempLeague(e.target.value); setTempTeam(null); }} 
                                  className="bg-nocturnal border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-neon-green"
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
                                  className="bg-nocturnal border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-neon-green disabled:opacity-30"
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
                                <button type="button" onClick={() => setActiveTeamIdForSelection(null)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Ləğv Et</button>
                                <button 
                                  type="button" 
                                  onClick={handleClubSelectionFinish} 
                                  disabled={!tempTeam} 
                                  className="px-4 py-1.5 bg-neon-green text-nocturnal text-[9px] font-black uppercase rounded-lg disabled:opacity-50 hover:scale-105 transition-transform"
                                >
                                  Təsdiqlə
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button"
                      onClick={addTeam}
                      className="w-full mt-3 py-3 border border-dashed border-white/10 rounded-xl font-label text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-neon-green hover:border-neon-green/40 hover:bg-neon-green/5 transition-all"
                    >
                      Daha çox komanda əlavə et
                    </button>
                  </section>

                  {/* Section 2: Turnir Tipi */}
                  <section>
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div className="w-1.5 h-6 bg-neon-green rounded-full shadow-[0_0_10px_#00ff84]"></div>
                      <h2 className="font-headline font-extrabold text-lg md:text-xl uppercase tracking-widest text-white italic">Turnir Tipi</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* UCL Card */}
                      <div 
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
                        className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all h-24 md:h-32 border ${type === TournamentType.CHAMPIONS_LEAGUE ? 'neon-border-active' : 'border-white/10 bg-surface-dark hover:border-neon-green/30'}`}
                      >
                        <img alt="UCL" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGoOO7b9VrU4MvBX0daLHo8bKcpjkDXUMX9_aBPtdvC_ODyVZ6FHmtgRKy4yrLqI61M-Uj1l9cGwll42EMZrD43FEE3bhcW3ZID-IPTMmgJ0U16I3Nu1pmU3nIFkngieBl-ZlEl-j19c-Dw7aI36n7SlCXHcljMF9lkRgUE5eIEKTWYrP5QyH3BZEKCHKv5jS9ka22xJf1PLTgw8vUmRheuNH_UeIV6xL3ZqZ8PVtN5uGnAWVWsmKR4fiAC4PXvlTJhzq5rNn1M8o"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-nocturnal via-nocturnal/20 to-transparent"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                          <span className={`material-symbols-outlined text-2xl md:text-4xl mb-1 transition-all ${type === TournamentType.CHAMPIONS_LEAGUE ? 'text-neon-green drop-shadow-[0_0_10px_rgba(0,255,132,0.8)]' : 'text-slate-500'}`} data-icon="sports_soccer">sports_soccer</span>
                          <span className={`font-headline font-black text-xs md:text-lg tracking-widest italic uppercase transition-colors ${type === TournamentType.CHAMPIONS_LEAGUE ? 'text-white' : 'text-slate-500'}`}>UCL</span>
                        </div>
                      </div>
                      {/* World Cup Card */}
                      <div 
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
                        className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all h-24 md:h-32 border ${type === TournamentType.WORLD_CUP ? 'neon-border-active' : 'border-white/10 bg-surface-dark hover:border-neon-green/30'}`}
                      >
                        <img alt="Dünya Kuboku" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ-446xmGZTCHS1DK_7w5kSev4YgGJR2clAXN5TFHHcBr4KMJqQC-6r0wM2uCLoNYI9EIMljhCXkcitQB72iHi7VRkHNwVLolt0p559wzhDhs5tNSIWWGT62AKLiZ3IitRGWukJL9DnWTAnn8YYGUArXmM28dhz9wLTr1-J1FPRP7a5OF_hk9cuE3vcSi0PromxQmSahh_wbz1lGPA0YcqZ7ApbFpCwo49W6gUWEPnRHxkLpBfMqG-FvSgnqBqQgEawHJmzz__XJs"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-nocturnal via-nocturnal/40 to-transparent"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                          <span className={`material-symbols-outlined text-2xl md:text-4xl mb-1 transition-all ${type === TournamentType.WORLD_CUP ? 'text-neon-green drop-shadow-[0_0_10px_rgba(0,255,132,0.8)]' : 'text-slate-500'}`} data-icon="emoji_events">emoji_events</span>
                          <span className={`font-headline font-black text-xs md:text-lg tracking-widest italic uppercase transition-colors ${type === TournamentType.WORLD_CUP ? 'text-white' : 'text-slate-500'}`}>Dünya Kuboku</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Oyun Formatı */}
                  <section>
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div className="w-1.5 h-6 bg-neon-green rounded-full shadow-[0_0_10px_#00ff84]"></div>
                      <h2 className="font-headline font-extrabold text-lg md:text-xl uppercase tracking-widest text-white italic">Oyun Formatı</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {type === TournamentType.CHAMPIONS_LEAGUE ? (
                        <>
                          <button 
                            type="button"
                            onClick={() => setMode(TournamentMode.LEAGUE_KNOCKOUT)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${mode === TournamentMode.LEAGUE_KNOCKOUT ? 'bg-neon-green/10 border-neon-green/40 shadow-[inset_0_0_20px_rgba(0,255,132,0.05)]' : 'bg-white/5 border-white/5 hover:border-neon-green/30 hover:bg-white/10'}`}
                          >
                            <span className={`font-label uppercase tracking-widest text-xs transition-colors ${mode === TournamentMode.LEAGUE_KNOCKOUT ? 'font-black text-white' : 'font-bold text-slate-400 group-hover:text-white'}`}>Liqa + Pley-off</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${mode === TournamentMode.LEAGUE_KNOCKOUT ? 'bg-neon-green shadow-[0_0_15px_rgba(0,255,132,0.6)]' : 'border-2 border-white/10 group-hover:border-neon-green/50'}`}>
                              {mode === TournamentMode.LEAGUE_KNOCKOUT && <span className="material-symbols-outlined text-nocturnal text-sm font-black" data-icon="check">check</span>}
                            </div>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMode(TournamentMode.LEAGUE)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${mode === TournamentMode.LEAGUE ? 'bg-neon-green/10 border-neon-green/40 shadow-[inset_0_0_20px_rgba(0,255,132,0.05)]' : 'bg-white/5 border-white/5 hover:border-neon-green/30 hover:bg-white/10'}`}
                          >
                            <span className={`font-label uppercase tracking-widest text-xs transition-colors ${mode === TournamentMode.LEAGUE ? 'font-black text-white' : 'font-bold text-slate-400 group-hover:text-white'}`}>Liqa</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${mode === TournamentMode.LEAGUE ? 'bg-neon-green shadow-[0_0_15px_rgba(0,255,132,0.6)]' : 'border-2 border-white/10 group-hover:border-neon-green/50'}`}>
                              {mode === TournamentMode.LEAGUE && <span className="material-symbols-outlined text-nocturnal text-sm font-black" data-icon="check">check</span>}
                            </div>
                          </button>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setMode(TournamentMode.GROUP_KNOCKOUT)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${mode === TournamentMode.GROUP_KNOCKOUT ? 'bg-neon-green/10 border-neon-green/40 shadow-[inset_0_0_20px_rgba(0,255,132,0.05)]' : 'bg-white/5 border-white/5 hover:border-neon-green/30 hover:bg-white/10'}`}
                        >
                          <span className={`font-label uppercase tracking-widest text-xs transition-colors ${mode === TournamentMode.GROUP_KNOCKOUT ? 'font-black text-white' : 'font-bold text-slate-400 group-hover:text-white'}`}>Qrup + Pley-off</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${mode === TournamentMode.GROUP_KNOCKOUT ? 'bg-neon-green shadow-[0_0_15px_rgba(0,255,132,0.6)]' : 'border-2 border-white/10 group-hover:border-neon-green/50'}`}>
                            {mode === TournamentMode.GROUP_KNOCKOUT && <span className="material-symbols-outlined text-nocturnal text-sm font-black" data-icon="check">check</span>}
                          </div>
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => setMode(TournamentMode.KNOCKOUT)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${mode === TournamentMode.KNOCKOUT ? 'bg-neon-green/10 border-neon-green/40 shadow-[inset_0_0_20px_rgba(0,255,132,0.05)]' : 'bg-white/5 border-white/5 hover:border-neon-green/30 hover:bg-white/10'}`}
                      >
                        <span className={`font-label uppercase tracking-widest text-xs transition-colors ${mode === TournamentMode.KNOCKOUT ? 'font-black text-white' : 'font-bold text-slate-400 group-hover:text-white'}`}>Pley-off</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${mode === TournamentMode.KNOCKOUT ? 'bg-neon-green shadow-[0_0_15px_rgba(0,255,132,0.6)]' : 'border-2 border-white/10 group-hover:border-neon-green/50'}`}>
                          {mode === TournamentMode.KNOCKOUT && <span className="material-symbols-outlined text-nocturnal text-sm font-black" data-icon="check">check</span>}
                        </div>
                      </button>
                    </div>
                  </section>
                </div>

                {/* Action Button */}
                <div className="mt-6 md:mt-10">
                  <button type="submit" className="w-full button-3d-neon pulse-btn py-5 md:py-7 rounded-2xl font-headline font-black text-lg md:text-2xl text-nocturnal uppercase tracking-[0.2em] italic relative overflow-hidden group">
                    <span className="relative z-10">Püşkatmaya Başla</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>
              </form>
            </main>

            {/* Footer */}
            <footer className="mt-4 md:mt-6 text-center opacity-40">
              <p className="font-label font-medium text-white/40 text-[8px] md:text-[10px] uppercase tracking-[0.2em]">
                Polad tərəfindən düzəldilib
              </p>
            </footer>

            {/* Permission Modal */}
            {showPermissionModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-nocturnal/90 backdrop-blur-xl" onClick={() => setShowPermissionModal(false)}></div>
                <div className="relative w-full max-w-md elite-glass-card rounded-[2.5rem] p-8 md:p-12 border border-neon-green/20 bg-nocturnal shadow-[0_0_50px_rgba(0,255,132,0.1)] animate-in zoom-in duration-300">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-green/20">
                      <span className="material-symbols-outlined text-neon-green text-3xl">security</span>
                    </div>
                    <h3 className="font-headline font-black text-2xl text-white uppercase italic tracking-tight mb-2">Giriş İcazələri</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                      Turnirə qoşulan izləyicilər statistikaları dəyişə bilsin?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={() => setAllowViewerEdit(true)}
                      className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${allowViewerEdit ? 'bg-neon-green border-neon-green text-nocturnal' : 'bg-white/5 border-white/10 text-white hover:border-neon-green/50'}`}
                    >
                      <span className="font-headline font-black uppercase italic tracking-widest">Bəli, Dəyişsin</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${allowViewerEdit ? 'bg-nocturnal' : 'border-2 border-white/20'}`}>
                        {allowViewerEdit && <span className="material-symbols-outlined text-neon-green text-sm font-black">check</span>}
                      </div>
                    </button>
                    <button 
                      onClick={() => setAllowViewerEdit(false)}
                      className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${!allowViewerEdit ? 'bg-neon-green border-neon-green text-nocturnal' : 'bg-white/5 border-white/10 text-white hover:border-neon-green/50'}`}
                    >
                      <span className="font-headline font-black uppercase italic tracking-widest">Xeyr, Yalnız Mən</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${!allowViewerEdit ? 'bg-nocturnal' : 'border-2 border-white/20'}`}>
                        {!allowViewerEdit && <span className="material-symbols-outlined text-neon-green text-sm font-black">check</span>}
                      </div>
                    </button>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => setShowPermissionModal(false)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Ləğv Et
                    </button>
                    <button 
                      onClick={confirmStart}
                      className="flex-[2] py-4 bg-neon-green text-nocturnal font-black text-[10px] uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,255,132,0.4)] hover:scale-105 transition-all"
                    >
                      Turniri Başlat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Background Accents */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
              <div className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-green/5 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-green/5 rounded-full blur-[120px]"></div>
            </div>
          </div>
        )}
      </main>

      {/* Decorative Corner Element */}
      <div className="fixed bottom-0 right-0 w-64 h-64 pointer-events-none z-0 overflow-hidden">
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] border-[40px] border-secondary-fixed/5 rounded-full"></div>
      </div>
    </div>
  );
};

export default TournamentSetup;
