
import React, { useState, useEffect } from 'react';
import { Team } from '../types';

import { getCountryAbbreviation } from '../utils/tournamentLogic';

interface Props {
  teams: Team[];
  onFinish: (shuffledTeams: Team[]) => void;
  onStartMusic: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToMenu?: () => void;
  onOpenSocialFeed?: () => void;
}

const StarBall: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "", style = {} }) => (
  <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-white to-gray-300 rounded-full shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.4)] relative flex items-center justify-center overflow-hidden border border-gray-400 ${className}`} style={style}>
    {/* Subtle star pattern using CSS */}
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
  </div>
);

const DrawScene: React.FC<Props> = ({ teams, onFinish, onStartMusic, isMuted, onToggleMute, onBackToMenu, onOpenSocialFeed }) => {
  const [remainingTeams, setRemainingTeams] = useState<Team[]>([...(teams || [])].sort(() => Math.random() - 0.5));
  const [drawnTeams, setDrawnTeams] = useState<Team[]>([]);
  const [currentDrawn, setCurrentDrawn] = useState<Team | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState<'idle' | 'pick' | 'reveal'>('idle');
  const [hasStarted, setHasStarted] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    onStartMusic();
    
    // Set dynamic date
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('az-AZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
    setCurrentDate(formattedDate);
  }, [onStartMusic]);

  const handleDraw = () => {
    if (!hasStarted || isAnimating || remainingTeams.length === 0) return;
    setIsAnimating(true);
    setAnimPhase('pick');

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * remainingTeams.length);
      const nextTeam = remainingTeams[randomIndex];
      setCurrentDrawn(nextTeam);
      setAnimPhase('reveal');

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(nextTeam.name);
        utterance.lang = 'en-GB';
        utterance.pitch = 0.8; 
        utterance.rate = 0.85; 
        
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name.includes('Enceladus'));
        
        if (!selectedVoice) {
          const preferredMaleNames = ['Google UK English Male', 'Microsoft Mark', 'Daniel', 'Alex', 'Fred', 'Guy', 'Male'];
          selectedVoice = voices.find(v => 
            (v.lang.startsWith('en-')) && 
            preferredMaleNames.some(name => v.name.includes(name))
          );
        }
        
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.lang.startsWith('en-') && 
            !v.name.toLowerCase().includes('female')
          );
        }
        
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US');
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }

      setTimeout(() => {
        setDrawnTeams(prev => [...prev, nextTeam]);
        setRemainingTeams(prev => prev.filter((_, i) => i !== randomIndex));
        setIsAnimating(false);
        setAnimPhase('idle');
        setCurrentDrawn(null);
      }, 3000); 
    }, 1200);
  };

  useEffect(() => {
    if (remainingTeams.length === 0 && !isAnimating && hasStarted) {
      const timer = setTimeout(() => {
        onFinish(drawnTeams);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [remainingTeams.length, isAnimating, drawnTeams, onFinish, hasStarted]);

  const handleSkip = () => {
    const allTeams = [...drawnTeams, ...remainingTeams];
    onFinish(allTeams);
  };

  const pairings = [];
  for (let i = 0; i < drawnTeams.length; i += 2) {
    if (i + 1 < drawnTeams.length) {
      pairings.push([drawnTeams[i], drawnTeams[i + 1]]);
    } else {
      pairings.push([drawnTeams[i], null]);
    }
  }

  return (
    <div className="fixed inset-0 ucl-carpet z-[60] overflow-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 flex flex-col h-screen w-full">
        <header className="flex justify-center items-center mb-4 md:mb-8 shrink-0 pt-4">
          <button 
            onClick={handleSkip}
            className="px-8 py-3 md:px-12 md:py-4 bg-[#39FF14]/20 border-2 border-[#39FF14]/40 rounded-2xl text-[10px] md:text-xs font-black tracking-[0.3em] text-[#39FF14] hover:bg-[#39FF14]/30 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(57,255,20,0.2)] transition-all uppercase"
          >
            PÜŞKATMAYI KEÇ
          </button>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center pb-8 md:pb-12 overflow-hidden">
          {/* Bowl Section */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative h-full">
            <div className="relative">
              <div className={`w-[240px] h-[240px] md:w-[350px] md:h-[350px] rounded-full glass-bowl relative overflow-hidden flex items-end justify-center p-4 md:p-8 transition-transform duration-500 ${isAnimating ? 'scale-95' : ''}`}>
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>
                <div className="relative w-full h-full flex flex-wrap justify-center items-end gap-1 pb-4">
                  {remainingTeams.map((_, idx) => (
                    <div 
                      key={idx} 
                      className="ball-float w-10 h-10 md:w-20 md:h-20 bg-white rounded-full shadow-xl relative flex items-center justify-center overflow-hidden border border-white/20" 
                      style={{ 
                        animationDelay: `${idx * 0.2}s`, 
                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e5e7eb 50%, #9ca3af 100%)' 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/60"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleDraw}
              disabled={isAnimating || remainingTeams.length === 0}
              className="mt-8 md:mt-12 group relative px-8 md:px-10 py-3 md:py-4 bg-transparent border border-white/30 text-white font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs rounded-full overflow-hidden transition-all hover:border-uclaccent/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">{isAnimating ? 'PÜŞK ATILIR...' : 'Səbətə Toxun'}</span>
            </button>
          </div>

          {/* Reveal Section */}
          <div className="lg:col-span-4 flex items-center justify-center h-full">
            <div className="w-full max-w-[400px] relative">
              <div className="min-h-[200px] md:min-h-[300px] flex flex-col justify-center">
                {currentDrawn && animPhase === 'reveal' ? (
                  <div className="reveal-paper shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-500">
                    <div className="h-14 md:h-16 bg-[#001133] rounded-t-sm flex items-center px-4 md:px-6 relative overflow-hidden border-b border-black/10">
                      <img src={currentDrawn.logo} className="h-6 md:h-8 w-auto object-contain relative z-10" alt="" />
                    </div>
                    <div className="bg-white px-4 py-8 md:px-6 md:py-12 text-center border-x border-gray-200 shadow-inner relative">
                      <div className="space-y-1">
                        <h3 className="text-xl md:text-3xl leading-tight font-black text-black tracking-tight uppercase truncate">
                          {currentDrawn.name}
                        </h3>
                        <p className="text-lg md:text-xl font-bold text-black opacity-80">({getCountryAbbreviation(currentDrawn.country || "")})</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white rounded-b-sm border-x border-b border-gray-200"></div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/10 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-4xl text-white/20 mb-4">hourglass_empty</span>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Səbətdən top seçilməsini gözləyin</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pairings Section */}
          <div className="lg:col-span-4 flex flex-col h-full overflow-hidden bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-uclaccent">groups</span>
              <h3 className="font-display text-lg tracking-widest uppercase italic">EŞLEŞMELER</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {pairings.map((pair, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 w-[40%]">
                    <div className="w-8 h-8 bg-white/10 rounded-full p-1 border border-white/10 flex items-center justify-center">
                      <img src={pair[0].logo} className="w-full h-full object-contain" alt="" />
                    </div>
                    <span className="text-[10px] font-black uppercase truncate">{pair[0].name}</span>
                  </div>
                  <div className="text-[8px] font-black text-uclaccent/40">VS</div>
                  <div className="flex items-center justify-end gap-3 w-[40%]">
                    <span className="text-[10px] font-black uppercase truncate text-right">{pair[1] ? pair[1].name : '...'}</span>
                    <div className="w-8 h-8 bg-white/10 rounded-full p-1 border border-white/10 flex items-center justify-center">
                      {pair[1] ? (
                        <img src={pair[1].logo} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <span className="material-symbols-outlined text-xs text-white/20">help</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pairings.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Hələ püşk atılmayıb</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="py-4 flex justify-between items-center border-t border-white/10 mt-auto shrink-0">
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-slate-500">
            RƏSMİ PÜŞKATMA <span className="text-white opacity-40">SİSTEMİ</span>
          </p>
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-slate-500">
            DİZAYN EDİB: <span className="text-uclaccent">Polad</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DrawScene;
