import React, { useEffect, useRef } from 'react';
import { Standing } from '../types';
import confetti from 'canvas-confetti';

interface Props {
  winner: Standing;
  mvp: string;
  onClose: () => void;
  onReset: (name?: string) => void;
  onPlayPuskas: () => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const WinnerOverlay: React.FC<Props> = ({ winner, mvp, onClose, onReset, onPlayPuskas }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!winner) return;

    // Confetti effect
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Since we don't have team colors easily available in Standing, we use gold/silver/blue as defaults
      // or we could try to infer from team name if we had a mapping.
      // For now, let's use a nice mix of gold, silver and blue.
      const colors = ['#FFD700', '#C0C0C0', '#38bdf8', '#ffffff'];

      confetti({
        ...defaults,
        particleCount,
        colors,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        colors,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Audio effect
    // Audio removed due to loading issues
    audioRef.current = null;

    return () => {
      clearInterval(interval);
    };
  }, [winner]);

  if (!winner) return null;

  const handleEndTournament = () => {
    const name = prompt("Turnirin adını daxil edin (Tarixçəyə yazılacaq):");
    if (name) {
      onReset(name); // This will call saveAndResetTournament in App.tsx
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-ucl-navy text-on-surface">
      {/* Midnight Pitch Atmosphere */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a1421] via-[#020617] to-black"></div>
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px), radial-gradient(circle, rgba(56, 189, 248, 0.5) 1px, transparent 1px)',
             backgroundSize: '150px 150px, 250px 250px',
             animation: 'drift 60s linear infinite'
           }}>
      </div>
      
      {/* Dynamic Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-ucl-blue/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <main className="relative z-10 w-full max-w-5xl flex flex-col items-center px-6 py-12 overflow-y-auto custom-scrollbar">
        {/* Puskas Button */}
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={onPlayPuskas}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-orange-600 text-white font-headline font-black text-xs md:text-sm tracking-[0.15em] shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:shadow-[0_0_50px_rgba(244,63,94,0.8)] transform hover:scale-105 active:scale-95 transition-all duration-300 uppercase italic animate-pulse border border-white/20 flex items-center gap-2"
          >
            <span className="text-xl">🎬</span>
            <span>MÖVSÜMÜN QOLLARI (PUSKAS)</span>
          </button>
        </div>

        {/* Title Section */}
        <header className="text-center mb-10 md:mb-16 mt-8">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-ucl-blue font-bold mb-4 block opacity-90">UEFA Champions League Elite</span>
          <h1 className="font-headline text-4xl md:text-8xl font-black tracking-tighter text-white cinematic-glow uppercase italic">TƏBRİKLƏR, ÇEMPİON!</h1>
          <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-ucl-blue/30 to-transparent mx-auto mt-8 shadow-[0_0_20px_rgba(56,189,248,0.5)]"></div>
        </header>

        {/* Central Trophy Section */}
        <div className="relative w-full flex flex-col items-center justify-center mb-10 md:mb-16">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-white/5 rounded-full blur-[80px]"></div>
          <div className="relative group">
            <img 
              alt="UCL Trophy" 
              className="w-56 md:w-[400px] h-auto trophy-glow transform hover:scale-105 transition-transform duration-700 ease-out z-20" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMlKzd06uWuOlO_j5avxfYY-jFD-t0Gvt8kib4tVicVAEbAxT55vKJAA2QIzHJ1OU1bwkuZ3_0cxZuJQq802-AFzBnDQAEaGG4hLrpLeMBa_noOadvT-FKaMN1CwnFhAbtNS67mn488XF0xCrnRD-ma0lphtoQ-7X6ofEAqtk93nwwZE14is6VO_42xjABGOdRW5yZIlz28xYw8y1wVLoJcpYtBVAGMSMYil_zecHLQ_wTQjwcDdZvn8J2DGH-4AE96A0POg3D-Ps"
            />
            {/* Winner Badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[280px]">
              <div className="ucl-glass flex items-center gap-4 px-6 py-3 rounded-full border border-white/20">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ucl-blue to-primary flex items-center justify-center p-0.5 shadow-lg overflow-hidden shrink-0">
                  <img 
                    alt="Winner Logo" 
                    className="w-full h-full rounded-full object-cover bg-white" 
                    src={winner.teamLogo || DEFAULT_LOGO} 
                  />
                </div>
                <p className="font-headline font-extrabold text-white tracking-wide truncate uppercase italic">{winner.teamName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Glass Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mb-12">
          {/* Qollar Card */}
          <div className="ucl-glass rounded-2xl p-6 md:p-8 flex flex-col items-center group hover:bg-white/5 transition-all duration-300">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ucl-blue/10 flex items-center justify-center mb-4 border border-ucl-blue/20">
              <span className="material-symbols-outlined text-ucl-blue text-2xl md:text-3xl">sports_soccer</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">QOLLAR</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-white">{winner.gf || 0}</span>
          </div>
          {/* Xal Card */}
          <div className="ucl-glass rounded-2xl p-6 md:p-8 flex flex-col items-center group hover:bg-white/5 transition-all duration-300">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ucl-blue/10 flex items-center justify-center mb-4 border border-ucl-blue/20">
              <span className="material-symbols-outlined text-ucl-blue text-2xl md:text-3xl">stars</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">XAL</span>
            <span className="font-headline font-black text-3xl md:text-4xl text-white">{winner.pts || 0}</span>
          </div>
          {/* MVP Card */}
          <div className="ucl-glass rounded-2xl p-6 md:p-8 flex flex-col items-center group hover:bg-white/5 transition-all duration-300">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-ucl-blue/10 flex items-center justify-center mb-4 border border-ucl-blue/20">
              <span className="material-symbols-outlined text-ucl-blue text-2xl md:text-3xl">person</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1 text-center">ƏN YAXŞI OYUNÇU</span>
            <span className="font-headline font-black text-lg md:text-2xl text-white text-center truncate w-full uppercase italic">{mvp}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          <button 
            onClick={handleEndTournament}
            className="w-full py-5 rounded-full bg-gradient-to-r from-ucl-blue to-blue-600 text-white font-headline font-black text-lg tracking-[0.1em] shadow-[0_10px_30px_rgba(56,189,248,0.3)] hover:shadow-[0_15px_40px_rgba(56,189,248,0.4)] transform hover:-translate-y-1 active:scale-95 transition-all duration-300 uppercase italic"
          >
            TURNİRİ BİTİR
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-sm uppercase tracking-[0.15em] transition-all duration-300 backdrop-blur-md"
          >
            Turnirə qayıt
          </button>
        </div>
      </main>

      {/* Bottom Vignette */}
      <div className="fixed bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black to-transparent pointer-events-none z-0"></div>

      <style>{`
        @keyframes drift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 500px 1000px, 400px 800px; }
        }
        .cinematic-glow {
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        .trophy-glow {
          filter: drop-shadow(0 0 60px rgba(56, 189, 248, 0.2)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.1));
        }
        .ucl-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default WinnerOverlay;
