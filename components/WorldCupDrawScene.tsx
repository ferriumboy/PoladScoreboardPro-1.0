import React, { useState, useEffect } from 'react';
import { Team, TournamentMode } from '../types';

interface Props {
  teams: Team[];
  mode: TournamentMode;
  onFinish: (shuffledTeams: Team[]) => void;
  onStartMusic: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToMenu?: () => void;
  onOpenSocialFeed?: () => void;
}

const WorldCupDrawScene: React.FC<Props> = ({
  teams, mode, onFinish, onStartMusic, isMuted, onToggleMute, onBackToMenu
}) => {
  const isKnockoutOnly = mode === TournamentMode.KNOCKOUT;
  const [pots, setPots] = useState<Team[][]>([[], [], [], []]);
  const [groups, setGroups] = useState<Record<string, Team[]>>(() => {
    if (isKnockoutOnly) {
      const numMatches = Math.max(1, Math.ceil((teams || []).length / 2));
      const initialMatches: Record<string, Team[]> = {};
      for (let i = 0; i < numMatches; i++) {
        initialMatches[`MATÇ ${i + 1}`] = [];
      }
      return initialMatches;
    }
    const numGroups = Math.max(1, Math.ceil((teams || []).length / 4));
    const initialGroups: Record<string, Team[]> = {};
    for (let i = 0; i < numGroups; i++) {
      initialGroups[String.fromCharCode(65 + i)] = [];
    }
    return initialGroups;
  });
  const [currentDrawn, setCurrentDrawn] = useState<Team | null>(null);
  const [animPhase, setAnimPhase] = useState<'idle' | 'shake' | 'reveal'>('idle');
  const [hasStarted, setHasStarted] = useState(true);

  useEffect(() => {
    onStartMusic();
  }, [onStartMusic]);

  useEffect(() => {
    if (isKnockoutOnly) {
      const numMatches = Math.max(1, Math.ceil((teams || []).length / 2));
      const initialMatches: Record<string, Team[]> = {};
      for (let i = 0; i < numMatches; i++) {
        initialMatches[`MATÇ ${i + 1}`] = [];
      }
      setGroups(initialMatches);
    } else {
      const numGroups = Math.max(1, Math.ceil((teams || []).length / 4));
      const initialGroups: Record<string, Team[]> = {};
      for (let i = 0; i < numGroups; i++) {
        initialGroups[String.fromCharCode(65 + i)] = [];
      }
      setGroups(initialGroups);
    }

    const initialPots: Team[][] = [[], [], [], []];
    const shuffled = [...(teams || [])].sort(() => Math.random() - 0.5);
    const teamsPerPot = Math.ceil(shuffled.length / 4);
    
    shuffled.forEach((team, index) => {
      const potIndex = Math.floor(index / teamsPerPot);
      if (potIndex < 4) initialPots[potIndex].push(team);
    });
    setPots(initialPots);
  }, [teams, isKnockoutOnly]);

  const handleDraw = () => {
    if (!hasStarted || animPhase !== 'idle') return;

    const potIndex = pots.findIndex(p => p.length > 0);
    if (potIndex === -1) return;

    setAnimPhase('shake');

    setTimeout(() => {
      const pot = pots[potIndex];
      const randomTeamIndex = Math.floor(Math.random() * pot.length);
      const drawnTeam = pot[randomTeamIndex];
      setCurrentDrawn(drawnTeam);
      setAnimPhase('reveal');

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(drawnTeam.name);
        utterance.lang = 'en-GB';
        utterance.pitch = 0.8; 
        utterance.rate = 0.85; 
        window.speechSynthesis.speak(utterance);
      }

      setTimeout(() => {
        setGroups(prev => {
          const newGroups = { ...prev };
          const groupKeys = Object.keys(newGroups);
          let targetGroup = groupKeys[0];
          let minLen = newGroups[targetGroup].length;
          
          for (const key of groupKeys) {
            if (newGroups[key].length < minLen) {
              targetGroup = key;
              minLen = newGroups[key].length;
            }
          }
          
          newGroups[targetGroup] = [...newGroups[targetGroup], drawnTeam];
          return newGroups;
        });

        setPots(prev => {
          const newPots = [...prev];
          newPots[potIndex] = newPots[potIndex].filter((_, i) => i !== randomTeamIndex);
          return newPots;
        });

        setAnimPhase('idle');
        setCurrentDrawn(null);
      }, 2000);
    }, 1000);
  };

  const handleSkip = () => {
    // Collect all teams from pots and groups
    const remainingFromPots = pots.flat();
    const alreadyInGroups = Object.values(groups).flat();
    onFinish([...alreadyInGroups, ...remainingFromPots]);
  };

  useEffect(() => {
    const allDrawn = pots.every(p => p.length === 0);
    if (allDrawn && animPhase === 'idle' && hasStarted) {
      const timer = setTimeout(() => {
        const finalTeams = Object.values(groups).flat();
        onFinish(finalTeams);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pots, animPhase, hasStarted, groups, onFinish]);

  return (
    <div className="fixed inset-0 wc-bg z-[60] overflow-hidden flex flex-col">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-0.5 md:px-6 py-0.5 md:py-6 flex flex-col h-full transform scale-[0.75] origin-top md:scale-100">
        
        {/* Header - Simplified */}
        <header className="flex justify-center items-center mb-0.5 md:mb-6 shrink-0 px-1 pt-4">
          <button 
            onClick={handleSkip}
            className="px-8 py-3 md:px-12 md:py-4 bg-[#d4af37]/20 border-2 border-[#d4af37]/40 rounded-2xl text-[10px] md:text-xs font-black tracking-[0.3em] text-[#d4af37] hover:bg-[#d4af37]/30 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all uppercase"
          >
            PÜŞKATMAYI KEÇ
          </button>
        </header>

        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
          
          {/* Center Section: The Action */}
            <div className="flex flex-col items-center justify-center py-0.5 md:py-12 shrink-0 min-h-[60px] md:min-h-[280px]">
              <div className="border border-blue-400/20 rounded-sm md:rounded-3xl p-0.5 md:p-20 flex items-center justify-center w-full max-w-3xl bg-black/10 backdrop-blur-sm">
                {animPhase === 'reveal' && currentDrawn ? (
                  <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="w-6 h-6 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center p-0.5 md:p-3 shadow-[0_0_60px_rgba(212,175,55,0.7)] border border-[#d4af37] mb-0.5 md:mb-6 transform hover:scale-105 transition-transform">
                      <img src={currentDrawn.logo} onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/16/16480.png")} className="w-full h-full object-contain" alt="" />
                    </div>
                    <h2 className="text-[6px] md:text-5xl font-black text-white tracking-[0.1em] uppercase text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      {currentDrawn.name}
                    </h2>
                  </div>
                ) : pots.every(p => p.length === 0) ? (
                  <button 
                    onClick={() => {
                      const finalTeams: Team[] = [];
                      (Object.values(groups) as Team[][]).forEach(groupTeams => {
                        finalTeams.push(...groupTeams);
                      });
                      onFinish(finalTeams);
                    }}
                    className="px-2 py-1 md:px-16 md:py-6 bg-[#d4af37] text-[#001640] font-black text-[6px] md:text-lg uppercase tracking-widest rounded-full shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:scale-110 transition-all active:scale-95 animate-bounce"
                  >
                    PÜŞKATMANI BİTİR
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={handleDraw} 
                      disabled={animPhase !== 'idle'}
                      className={`relative group ${animPhase === 'shake' ? 'wc-shake' : ''} transition-all active:scale-95`}
                    >
                      <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative px-1 py-0.5 md:px-20 md:py-10 bg-[#001640] rounded-full border border-[#d4af37] flex items-center gap-0.5 md:gap-5 hover:bg-[#d4af37]/10 transition-all disabled:opacity-40 disabled:grayscale shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <div className="w-2 h-2 md:w-14 md:h-14 rounded-full wc-ball shadow-2xl"></div>
                        <span className="font-black text-[5px] md:text-xl text-[#d4af37] tracking-[0.1em] md:tracking-[0.2em] uppercase">
                          {animPhase === 'shake' ? 'ATILIR...' : 'NÖVBƏTİ SEÇ'}
                        </span>
                      </div>
                    </button>
                    {/* Removed manual finish button as it's now automatic */}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Groups Grid */}
            <div className={`grid gap-0.5 md:gap-8 flex-1 pb-10 px-0.5 ${
              Object.keys(groups).length === 1 ? 'grid-cols-1 max-w-lg mx-auto w-full' :
              Object.keys(groups).length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto w-full' :
              Object.keys(groups).length === 3 ? 'grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto w-full' :
              'grid-cols-2 md:grid-cols-4'
            }`}>
              {Object.entries(groups).map(([groupName, groupTeams]) => (
                <div key={groupName} className="wc-glass rounded-sm md:rounded-3xl overflow-hidden flex flex-col hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-500 border-t border-t-[#d4af37] group">
                  <div className="bg-[#001640] py-0.5 md:py-4 px-0.5 md:px-6 border-b border-[#d4af37]/20">
                    <h3 className="text-center font-black text-[5px] md:text-2xl text-white tracking-tighter md:tracking-[0.2em] uppercase">
                      {isKnockoutOnly ? groupName : `GROUP ${groupName}`}
                    </h3>
                  </div>
                  <div className="p-0.5 md:p-6 flex flex-col gap-0.5 md:gap-4 flex-1 bg-black/20">
                    {Array.from({ length: isKnockoutOnly ? 2 : Math.max(4, (groupTeams as Team[]).length) }).map((_, slot) => {
                      const team = (groupTeams as Team[])[slot];
                      return (
                        <div key={slot} className="h-3 md:h-16 bg-[#001640]/60 rounded-sm md:rounded-2xl border border-white/5 flex items-center px-0.5 md:px-4 gap-0.5 md:gap-4 overflow-hidden shadow-inner group-hover:border-[#d4af37]/30 transition-colors">
                          <span className="text-[4px] md:text-sm font-black text-[#d4af37] w-1 md:w-6 opacity-60">{slot + 1}</span>
                          {team ? (
                            <div className="flex items-center gap-0.5 md:gap-4 animate-in slide-in-from-top-4 fade-in duration-700 flex-1">
                              <div className="w-2 h-2 md:w-10 md:h-10 bg-white rounded-full p-0.5 md:p-1.5 shadow-lg">
                                <img src={team.logo} onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/16/16480.png")} className="w-full h-full object-contain" alt="" />
                              </div>
                              <span className="text-[5px] md:text-base font-black text-white uppercase truncate tracking-wider">{team.name}</span>
                            </div>
                          ) : (
                            <div className="flex-1 border-b border-dashed border-white/10 mx-0.5 md:mx-4"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
      </div>
    </div>
  );
};

export default WorldCupDrawScene;
