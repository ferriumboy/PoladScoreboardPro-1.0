
import React, { useState } from 'react';
import { InterviewData, InterviewOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: InterviewData;
  onComplete: (selectedOption: InterviewOption | null) => void;
}

const FlashZone: React.FC<Props> = ({ data, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<InterviewOption | null>(null);
  const [showReaction, setShowReaction] = useState(false);

  const currentQuestion = (data?.questions || [])[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-[#000a1a] font-display text-white">
        <div className="bg-[#001b4d]/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center">
          <span className="material-symbols-outlined text-5xl text-[#00ffcc] mb-4 animate-spin">sync</span>
          <p className="text-xl font-bold uppercase italic tracking-widest">Müsahibə yüklənir...</p>
          <button onClick={() => onComplete(null)} className="mt-6 px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold uppercase hover:bg-white/20 transition-colors">Bağla</button>
        </div>
      </div>
    );
  }

  const handleSelect = (option: InterviewOption) => {
    setSelectedOption(option);
    setShowReaction(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (data?.questions || []).length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowReaction(false);
    } else {
      onComplete(selectedOption);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[#000a1a] font-display text-white overflow-hidden selection:bg-[#00ffcc] selection:text-[#000a1a]">
      {/* Main Broadcast Container */}
      <div className="relative min-h-[100dvh] w-full flex flex-col overflow-x-hidden overflow-y-auto">
        
        {/* Sponsor Backdrop (The Wall) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="grid grid-cols-4 md:grid-cols-8 w-full h-full">
            {[...Array(64)].map((_, i) => {
              const logos = [
                "https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Heineken_logo.svg/1920px-Heineken_logo.svg.png",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png",
                "https://logos-world.net/wp-content/uploads/2020/12/Pepsi-Logo.png",
                "https://upload.wikimedia.org/wikipedia/commons/9/9d/FedEx_Express.svg",
                "https://upload.wikimedia.org/wikipedia/en/6/62/Turkish_Airlines_logo_%28large%29.svg"
              ];
              // Checkered pattern logic
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 === 0;
              
              return (
                <div key={i} className={`flex items-center justify-center border border-white/10 ${isDark ? 'bg-[#001242]/60' : 'bg-[#001b4d]/60'} shadow-inner`}>
                  <div className="w-full h-full flex items-center justify-center p-2 border border-white/5">
                    <img src={logos[i % logos.length]} className="max-h-[15px] md:max-h-[25px] object-contain opacity-30 hover:opacity-100 transition-opacity duration-300" alt="Sponsor" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Navigation Bar */}
        <header className="relative z-20 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-8 gap-4">
          <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 md:gap-4 bg-[#001b4d]/80 backdrop-blur-md px-4 md:px-6 py-2 md:py-4 rounded-xl border border-white/10 shadow-2xl">
              <span className="material-symbols-outlined text-[#00ffcc] text-2xl md:text-4xl">mic</span>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl font-black tracking-[0.2em] uppercase leading-none">Flash Zone</h1>
                <span className="text-[8px] md:text-[10px] text-[#00ffcc] tracking-[0.3em] uppercase mt-1">Mətbuat Konfransı</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 bg-red-600 px-3 md:px-5 py-1.5 md:py-2 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
              <div className="size-2 md:size-3 bg-white rounded-full"></div>
              <span className="text-xs md:text-sm font-black tracking-widest uppercase text-white">Canlı</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end bg-[#001b4d]/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
            <p className="text-[10px] text-[#00ffcc] uppercase font-black tracking-widest mb-1">Yayım Vaxtı</p>
            <p className="text-2xl font-mono font-bold text-white tabular-nums">00:42:15</p>
          </div>
        </header>

        {/* Main Interaction Area */}
        <main className="relative z-20 flex-1 flex flex-col justify-end pb-4 md:pb-8 px-4 md:px-8">
          <AnimatePresence mode="wait">
            {!showReaction ? (
              <motion.div 
                key="question-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl mx-auto flex flex-col justify-end gap-3 md:gap-6"
              >
                {/* Lower Third (The Question) */}
                <div className="flex flex-col mb-2 md:mb-4">
                  <div className="inline-flex items-center self-start bg-[#00ffcc] text-[#000a1a] px-3 md:px-5 py-1 md:py-1.5 rounded-t-lg font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
                      Jurnalist Sualı
                  </div>
                  <div className="bg-[#001b4d]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-tr-2xl rounded-b-2xl border-l-4 md:border-l-8 border-l-[#00ffcc] border border-white/10 shadow-2xl relative overflow-hidden">
                    <span className="material-symbols-outlined absolute top-2 right-4 md:top-4 md:right-6 text-4xl md:text-6xl text-white/5 rotate-180">format_quote</span>
                    <h2 className="text-base md:text-xl lg:text-2xl font-bold leading-snug text-white italic relative z-10">
                        "{currentQuestion.question}"
                    </h2>
                  </div>
                </div>

                {/* Interactive Options Overlay */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    const isPro = opt.type === 'PROFESSIONAL';
                    const colorClass = isPro ? 'text-[#0df20d]' : 'text-yellow-400';
                    const borderClass = isPro ? 'border-[#0df20d]' : 'border-yellow-400';
                    const bgHoverClass = isPro ? 'hover:bg-[#0df20d]/10' : 'hover:bg-yellow-400/10';
                    const icon = isPro ? 'verified_user' : 'sentiment_dissatisfied';
                    const label = isPro ? 'PROFESSİONAL CAVAB' : 'TROLL CAVAB';

                    return (
                      <button 
                        key={idx}
                        onClick={() => handleSelect(opt)}
                        className={`group flex flex-col items-start p-3 md:p-5 bg-[#001b4d]/90 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/30 transition-all active:scale-[0.98] shadow-2xl ${bgHoverClass}`}
                      >
                        <div className="flex items-center gap-2 mb-2 md:mb-3 w-full border-b border-white/10 pb-2">
                          <span className={`material-symbols-outlined ${colorClass} text-lg md:text-xl`}>{icon}</span>
                          <span className={`text-[8px] md:text-[9px] font-black ${colorClass} uppercase tracking-[0.2em]`}>{label}</span>
                        </div>
                        <p className="text-xs md:text-sm font-medium text-white/90 text-left leading-relaxed flex-grow">{opt.text}</p>
                        <div className="mt-3 md:mt-4 flex items-center text-[7px] md:text-[8px] text-white/40 font-black uppercase tracking-widest w-full justify-between group-hover:text-white/70 transition-colors">
                          <span>Seçmək üçün klikləyin</span>
                          <span className="material-symbols-outlined text-[10px] md:text-xs">arrow_forward</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="reaction-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl mx-auto flex flex-col justify-end gap-3 md:gap-6"
              >
                <div className="flex flex-col">
                  <div className="inline-flex items-center self-start bg-[#0df20d] text-[#000a1a] px-3 md:px-5 py-1 md:py-1.5 rounded-t-lg font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
                      Jurnalistin Reaksiyası
                  </div>
                  <div className="bg-[#001b4d]/95 backdrop-blur-2xl p-4 md:p-6 lg:p-8 rounded-tr-2xl rounded-b-2xl border-l-4 md:border-l-8 border-l-[#0df20d] border border-white/10 shadow-2xl relative overflow-hidden">
                    <span className="material-symbols-outlined absolute top-2 right-4 md:top-4 md:right-6 text-4xl md:text-6xl text-white/5">chat_bubble</span>
                    <h2 className="text-base md:text-xl lg:text-2xl font-bold leading-snug text-white italic relative z-10 mb-4 md:mb-6">
                        "{selectedOption?.reaction}"
                    </h2>
                    <button 
                      onClick={handleNext}
                      className="bg-[#0df20d] hover:bg-[#0df20d]/80 text-[#000a1a] px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center gap-2 w-max shadow-[0_0_30px_rgba(13,242,13,0.3)] hover:shadow-[0_0_40px_rgba(13,242,13,0.5)]"
                    >
                      {currentQuestionIndex < data.questions.length - 1 ? 'Növbəti Sual' : 'Müsahibəni Bitir'}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer / Technical Info */}
        <footer className="relative z-20 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center md:items-end gap-2 md:gap-4 border-t border-white/10 bg-[#000a1a]/80 backdrop-blur-md mt-4 md:mt-0">
          <div className="flex items-center gap-4 md:gap-8 text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1 md:gap-2"><span className="material-symbols-outlined text-[10px] md:text-sm text-[#00ffcc]">graphic_eq</span> SƏS: STEREO</span>
            <span className="flex items-center gap-1 md:gap-2"><span className="material-symbols-outlined text-[10px] md:text-sm text-[#00ffcc]">hd</span> 45MBPS</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
            <span className="text-[#00ffcc] text-xs md:text-sm font-bold tracking-widest uppercase">
              {data.stadiumName || "Bilinmir"}, {data.teamCountry || "Bilinmir"}
            </span>
            <p className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              © 2026 İDMAN MEDİA YAYIMI - BAKI, AZƏRBAYCAN
            </p>
          </div>
        </footer>

        {/* Visual Lighting Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00ffcc]/10 blur-[120px] rounded-full pointer-events-none -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#001b4d]/40 blur-[150px] rounded-full pointer-events-none -ml-40 -mb-40"></div>
      </div>
    </div>
  );
};

export default FlashZone;
