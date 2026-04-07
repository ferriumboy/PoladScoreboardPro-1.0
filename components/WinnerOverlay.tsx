import React, { useEffect } from 'react';
import { Standing } from '../types';

interface Props {
  winner: Standing;
  onClose: () => void;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const WinnerOverlay: React.FC<Props> = ({ winner, onClose }) => {
  useEffect(() => {
    if (!winner) return;
    // @ts-ignore
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      // @ts-ignore
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      // @ts-ignore
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <div className="mb-6 relative inline-block">
          <img 
            src={winner.teamLogo || DEFAULT_LOGO} 
            onError={(e) => { 
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = DEFAULT_LOGO; 
            }}
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-emerald-500 shadow-lg shadow-emerald-500/50 bg-white" 
            alt="" 
          />
          <div className="absolute -top-2 -right-2 bg-yellow-500 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-900">#1</div>
        </div>

        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">ÇEMPİON TƏBRİK EDİRİK!</h3>
        <h2 className="text-4xl font-black text-white mb-6 leading-tight">
          {winner.teamName}
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-center">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Oyun</div>
            <div className="text-white font-bold">{winner.played}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Qələbə</div>
            <div className="text-white font-bold">{winner.won}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Xal</div>
            <div className="text-emerald-500 font-black">{winner.pts}</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02] transition-all"
        >
          Nəticələri Gör
        </button>
      </div>
    </div>
  );
};

export default WinnerOverlay;
