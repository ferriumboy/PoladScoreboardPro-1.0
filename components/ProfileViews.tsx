import React, { useState, useMemo } from 'react';
import { Trophy, BarChart3, Shield, Search, X, ChevronRight, TrendingUp, Goal, ShieldAlert, History, Settings, Info, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Team, TournamentState, TournamentMode } from '../types';
import { allFootballClubs } from '../data/clubs';

interface MyTournamentsProps {
  tournaments: TournamentState[];
  onSelectTournament: (id: string) => void;
  onClose: () => void;
}

export const MyTournaments: React.FC<MyTournamentsProps> = ({ tournaments, onSelectTournament, onClose }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const isFinished = t.matches.length > 0 && t.matches.every(m => m.isFinished);
      return activeTab === 'active' ? !isFinished : isFinished;
    });
  }, [tournaments, activeTab]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-wider">Mənim Turnirlərim</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="flex p-2 gap-2 bg-slate-800/30 m-4 rounded-2xl">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-green-500 text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            Aktiv Turnirlər
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'past' ? 'bg-green-500 text-slate-900 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            Keçmiş Turnirlər
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {filteredTournaments.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Heç bir turnir tapılmadı</p>
            </div>
          ) : (
            filteredTournaments.map(t => (
              <div 
                key={t.id}
                onClick={() => onSelectTournament(t.id)}
                className={`group p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer ${activeTab === 'active' ? 'hover:border-green-500/30' : 'hover:border-blue-500/30'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-black uppercase italic tracking-wide group-hover:text-green-400 transition-colors">{t.managerName || 'Adsız Turnir'}</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                      {new Date(parseInt(t.id.split('-')[1])).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t.teams.length} Komanda</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Hazırkı Mövqe: 2-ci yer</span>
                  </div>
                  {activeTab === 'active' && <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface MatchHistoryProps {
  matches: any[];
  onClose: () => void;
  onMatchClick: (match: any) => void;
  favoriteTeam?: Team | null;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, onClose, onMatchClick, favoriteTeam }) => {
  const stats = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter(m => m.result === 'W').length;
    const draws = matches.filter(m => m.result === 'D').length;
    const losses = matches.filter(m => m.result === 'L').length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const goalsScored = matches.reduce((acc, m) => acc + m.score, 0);
    const goalsConceded = matches.reduce((acc, m) => acc + m.opponentScore, 0);

    return { total, wins, draws, losses, winRate, goalsScored, goalsConceded };
  }, [matches]);

  const chartData = [
    { name: 'Wins', value: stats.wins, color: '#22c55e' },
    { name: 'Draws', value: stats.draws, color: '#facc15' },
    { name: 'Losses', value: stats.losses, color: '#ef4444' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 scale-90 md:scale-100">
        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-green-400" />
            <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-wider">Oyun Tarixçəsi və Statistika</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="relative h-40 md:h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl md:text-2xl font-black text-white italic">{stats.winRate}%</span>
                <span className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-tighter">Qələbə Faizi</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mb-1 md:mb-2" />
                <span className="text-lg md:text-xl font-black text-white italic">{stats.total}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-widest">Oyun</span>
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                <Goal className="w-4 h-4 md:w-5 md:h-5 text-green-400 mb-1 md:mb-2" />
                <span className="text-lg md:text-xl font-black text-white italic">{stats.goalsScored}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-widest">Vurulan Qol</span>
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-rose-400 mb-1 md:mb-2" />
                <span className="text-lg md:text-xl font-black text-white italic">{stats.goalsConceded}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-widest">Buraxılan Qol</span>
              </div>
              <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 mb-1 md:mb-2" />
                <span className="text-lg md:text-xl font-black text-white italic">{stats.wins}</span>
                <span className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-widest">Qələbə</span>
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          <div className="space-y-2">
            <h3 className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Son 10 Oyun</h3>
            <div className="space-y-2 max-h-[25vh] md:max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
              {matches.slice(0, 10).map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => onMatchClick(m)}
                  className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-[10px] md:text-xs shrink-0 ${
                    m.result === 'W' ? 'bg-green-500 text-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 
                    m.result === 'D' ? 'bg-yellow-500 text-slate-900 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 
                    'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  }`}>
                    {m.result}
                  </div>
                  <div className="flex-grow flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] md:text-xs font-bold truncate italic ${favoriteTeam?.name === m.teamName ? 'text-green-400' : 'text-white'}`}>{m.teamName}</span>
                      <span className="text-[10px] md:text-xs font-black text-white group-hover:text-green-400 transition-colors">{m.score} - {m.opponentScore}</span>
                      <span className={`text-[10px] md:text-xs font-bold truncate italic ${favoriteTeam?.name === m.opponentName ? 'text-green-400' : 'text-white/60'}`}>{m.opponentName}</span>
                    </div>
                    <span className="text-[7px] md:text-[8px] font-bold text-white/20 uppercase tracking-widest shrink-0 ml-2">
                      {new Date(m.date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/5 flex justify-center">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Polad tərəfindən hazırlandı</p>
        </div>
      </div>
    </div>
  );
};

interface TeamPreferencesProps {
  onSave: (team: Team) => void;
  onClose: () => void;
  initialTeam?: Team | null;
  isMandatory?: boolean;
}

import { countryFlags, getCountryTeams } from '../data/countries';

export const TeamPreferences: React.FC<TeamPreferencesProps> = ({ onSave, onClose, initialTeam, isMandatory }) => {
  const [step, setStep] = useState<'country' | 'team'>(initialTeam ? 'team' : 'country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(initialTeam || null);

  const countries = useMemo(() => getCountryTeams(), []);
  
  const filteredCountries = useMemo(() => {
    if (!search || step !== 'country') return countries;
    return countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, step, countries]);

  const filteredClubs = useMemo(() => {
    if (step !== 'team') return [];
    
    // Flatten all clubs
    let clubs = Object.values(allFootballClubs).flat();
    
    // If a country was selected, filter by it (if we have country mapping, which we don't strictly have in allFootballClubs keys)
    // Actually allFootballClubs is Record<string, ClubData[]>, where key is country name
    if (selectedCountry && allFootballClubs[selectedCountry as keyof typeof allFootballClubs]) {
        clubs = allFootballClubs[selectedCountry as keyof typeof allFootballClubs] as any;
    }

    if (!search) return clubs.slice(0, 10);
    return clubs.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);
  }, [search, step, selectedCountry]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 scale-90 md:scale-100">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-wider">
                {step === 'country' ? 'Favorit Ölkə' : 'Favorit Komanda'}
            </h2>
          </div>
          {!isMandatory && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-white/60" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={step === 'country' ? "Ölkə axtar..." : "Komanda axtar..."}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-bold"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {step === 'country' ? (
                <div key="country-list-container" className="grid grid-cols-2 gap-2">
                    {filteredCountries.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => {
                                setSelectedCountry(c.name);
                                setStep('team');
                                setSearch('');
                            }}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-left group"
                        >
                            <img src={c.logo} className="w-6 h-4 object-cover rounded-sm group-hover:scale-110 transition-transform" alt="" />
                            <span className="text-[10px] font-black text-white uppercase italic truncate">{c.name}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div key="club-list-container" className="space-y-2">
                    {filteredClubs.map((club) => (
                         <button 
                             key={club.id}
                             onClick={() => {
                                 setSelectedTeam({ id: club.id, name: club.name, logo: club.logo });
                                 setSearch('');
                             }}
                             className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-left"
                         >
                             {(!search) && <img src={club.logo} className="w-8 h-8 object-contain" alt="" />}
                             <span className="text-xs font-black text-white uppercase italic">{club.name}</span>
                         </button>
                    ))}
                </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-4 min-h-[160px] border-y border-white/5">
            {selectedTeam && !search ? (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
                  <img 
                    src={selectedTeam.logo} 
                    className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" 
                    alt="" 
                  />
                </div>
                <h3 className="mt-4 text-xl font-black text-white uppercase italic tracking-widest">{selectedTeam.name}</h3>
                {selectedCountry && <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{selectedCountry}</p>}
              </div>
            ) : !search && (
              <div className="text-center opacity-20">
                <Shield className="w-20 h-20 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Komanda seçilməyib</p>
              </div>
            )}
            {search && (
                 <div className="text-center opacity-40">
                    <p className="text-[9px] font-black uppercase tracking-widest">Axtarış nəticələri göstərilir...</p>
                 </div>
            )}
          </div>

          <div className="flex gap-2">
            {step === 'team' && (
                <button 
                  onClick={() => { setStep('country'); setSearch(''); }}
                  className="px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Geri
                </button>
            )}
            <button 
                disabled={!selectedTeam}
                onClick={() => selectedTeam && onSave(selectedTeam)}
                className="flex-1 py-4 bg-green-500 disabled:bg-white/5 disabled:text-white/20 text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] active:scale-95 transition-all"
            >
                Yadda Saxla
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-center">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Polad tərəfindən hazırlandı</p>
        </div>
      </div>
    </div>
  );
};

interface AppSettingsProps {
  onClose: () => void;
}

export const AppSettings: React.FC<AppSettingsProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-wider">Tənzimləmələr</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-2">Ümumi</h3>
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase italic">Dil Seçimi</span>
                </div>
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Azərbaycan</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase italic">Bildirişlər</span>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-white/20 text-center font-bold uppercase tracking-widest pt-4">Versiya 1.0.0 (Stable)</p>
        </div>
      </div>
    </div>
  );
};

interface RulesAndHelpProps {
  onClose: () => void;
}

export const RulesAndHelp: React.FC<RulesAndHelpProps> = ({ onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const rules = [
    {
      title: "Xallar eyni olanda nə olur?",
      content: "Xallar bərabər olduqda, qalibi müəyyən etmək üçün aşağıdakı ardıcıllıq tətbiq edilir:\n1. Ümumi top fərqi (Vurulan qol - Buraxılan qol).\n2. Öz aralarındakı oyunların nəticəsi.\n3. Daha çox vurulan qol sayı.\n4. Əgər hələ də bərabərlik varsa, püşk atılır."
    },
    {
      title: "Qırmızı vərəqə qaydası",
      content: "İntizam qaydaları turnirin gedişatına birbaşa təsir edir:\n- Birbaşa qırmızı vərəqə: Oyunçu növbəti 2 oyun üçün cəzalandırılır.\n- İki sarı vərəqə (bir oyunda): Oyunçu növbəti 1 oyun üçün cəzalandırılır.\n- Turnir boyu toplanan 3 sarı vərəqə: Növbəti 1 oyun cəza."
    },
    {
      title: "Turnirə necə qoşulmaq olar?",
      content: "Turnirə qoşulmaq üçün admin tərəfindən verilən 6 rəqəmli PİN kodu daxil etməlisiniz. 'Turnirə Qoşul' bölməsinə keçərək kodu yazın və 'Qoşul' düyməsini basın. Qoşulduqdan sonra siz turniri canlı izləyə və (əgər icazə verilibsə) statistikaları yeniləyə bilərsiniz."
    },
    {
      title: "Turnir tipləri necə işləyir?",
      content: "Tətbiqdə 3 əsas turnir tipi mövcuddur:\n- Çempionlar Liqası: Qrup mərhələsi və ardınca pley-off (ev-səfər sistemi).\n- Dünya Çempionatı: Qrup mərhələsi və tək oyunlu pley-off sistemi.\n- Liqa Sistemi: Bütün komandalar bir-biri ilə qarşılaşır, ən çox xal toplayan qalib olur."
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-black text-white uppercase italic tracking-wider">Qaydalar və Kömək</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {rules.map((rule, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <span className="text-sm font-black text-white uppercase italic text-left">{rule.title}</span>
                <ChevronRight className={`w-5 h-5 text-green-400 transition-transform ${openIndex === i ? 'rotate-90' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="p-4 pt-0 text-xs font-bold text-white/60 leading-relaxed whitespace-pre-line border-t border-white/5 mt-2">
                  {rule.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic tracking-wider mb-3">Çıxış Etmək?</h2>
          <p className="text-sm font-bold text-white/40 leading-relaxed">
            Hesabdan çıxmaq istədiyinizə əminsiniz? Turnir bildirişlərini almayacaqsınız.
          </p>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all"
          >
            Ləğv et
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 transition-all"
          >
            Çıxış et
          </button>
        </div>
      </div>
    </div>
  );
};
