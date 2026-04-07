
import React, { useState } from 'react';
import { Standing } from '../types';

interface Props {
  standings?: Standing[];
  groupedStandings?: Record<string, Standing[]>;
  onSave?: (name: string) => void;
  isFinished?: boolean;
}

const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

const Standings: React.FC<Props> = ({ standings, groupedStandings, onSave, isFinished }) => {
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const renderTable = (data: Standing[], title?: string) => (
    <div key={title || 'main'} className="mb-8">
      {title && (
        <h3 className="text-white font-black text-lg md:text-xl uppercase italic tracking-widest mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto custom-scrollbar mb-4 md:mb-10 -mx-2 md:mx-0 px-2 md:px-0">
        <table className="w-full text-left border-collapse min-w-[400px] md:min-w-[700px]">
          <thead>
            <tr className="border-b border-white/5 text-[6px] md:text-[10px] uppercase font-black tracking-widest text-white/40">
              <th className="pb-2 md:pb-6 pl-1 md:pl-4 w-6 md:w-12 text-center">#</th>
              <th className="pb-2 md:pb-6 pl-1 md:pl-4">KLUB</th>
              <th className="pb-2 md:pb-6 text-center text-white text-[8px] md:text-xs font-black">PTS</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">O</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">Q</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">H</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">M</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">VQ</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">BQ</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">TF</th>
              <th className="pb-2 md:pb-6 text-center text-cyan-400">FORMA</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((s, idx) => (
              <tr key={s.teamId} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                <td className="py-1.5 md:py-6 pl-1 md:pl-4 text-center">
                  <span className="text-[8px] md:text-xs font-bold text-white/20 group-hover:text-white transition-colors">{idx + 1}</span>
                </td>
                <td className="py-1.5 md:py-6 pl-1 md:pl-4">
                  <div className="flex items-center gap-1.5 md:gap-5">
                    <div className="w-5 h-5 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center p-0.5 shadow-lg group-hover:scale-110 transition-transform shrink-0">
                      <img 
                        src={s.teamLogo || DEFAULT_LOGO} 
                        onError={(e) => { 
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = DEFAULT_LOGO; 
                        }}
                        className="w-full h-full object-contain" 
                        alt="" 
                      />
                    </div>
                    <span className="text-[8px] md:text-base font-black text-white tracking-tight uppercase italic whitespace-nowrap">{s.teamName}</span>
                  </div>
                </td>
                <td className="py-1.5 md:py-6 text-center">
                  <span className="text-sm md:text-3xl font-black text-white">{s.pts}</span>
                </td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.played}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.won}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.drawn}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.lost}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.gf}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">{s.ga}</td>
                <td className="py-1.5 md:py-6 text-center text-[8px] md:text-sm font-bold text-cyan-400/80">
                   {s.gd > 0 ? `+${s.gd}` : s.gd}
                </td>
                <td className="py-1.5 md:py-6">
                   <div className="flex items-center justify-center gap-0.5 md:gap-1.5">
                      {(s.form || []).map((res, i) => (
                        <div key={`form-${s.teamId}-${i}`} className={`w-3 h-3 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[5px] md:text-[9px] font-black ${
                          res === 'Q' ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                          res === 'H' ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 
                          'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        }`}>
                          {res}
                        </div>
                      ))}
                      {(s.form || []).length === 0 && <span className="text-white/5 italic text-[8px]">--</span>}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="premium-glass-card rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden bg-[#020d2d] border border-white/10">
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-2 md:gap-3">
           <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-neon animate-pulse"></div>
           <span className="text-[9px] md:text-[11px] font-black text-neon uppercase tracking-[0.2em] italic">CANLI CƏDVƏL</span>
        </div>
        <div className="text-[7px] md:text-[9px] font-bold text-white/20 uppercase tracking-widest">
           SON YENİLƏNMƏ: İNDİ
        </div>
      </div>

      {groupedStandings && Object.keys(groupedStandings).length > 0 ? (
        Object.entries(groupedStandings).map(([groupName, data]) => renderTable(data as Standing[], groupName))
      ) : (
        renderTable(standings || [])
      )}

      {isFinished && !isSaving && (
        null
      )}

      {isSaving && (
        <div className="mt-6 md:mt-10 p-4 md:p-8 bg-black/40 rounded-3xl md:rounded-[2.5rem] border border-neon/30 animate-in zoom-in duration-300">
          <label className="block text-[8px] md:text-[10px] font-black text-neon uppercase tracking-widest mb-3 md:mb-4 italic">Turnir Üçün Ad Seçin</label>
          <input 
            value={saveName} 
            onChange={(e) => setSaveName(e.target.value)} 
            className="w-full bg-black/60 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-5 text-white mb-4 md:mb-6 outline-none focus:border-neon font-black text-lg md:text-2xl uppercase italic" 
            placeholder="Məs: Qış Turniri..." 
          />
          <div className="flex gap-3 md:gap-4">
            <button 
              onClick={() => { if(saveName.trim()) { onSave?.(saveName); setIsSaving(false); setSaveName(''); } }} 
              className="flex-1 bg-neon py-3 md:py-5 rounded-xl md:rounded-2xl text-[#010412] font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg active:scale-95"
            >
              TƏSDİQLƏ
            </button>
            <button 
              onClick={() => setIsSaving(false)} 
              className="flex-1 bg-white/5 py-3 md:py-5 rounded-xl md:rounded-2xl text-white/40 font-black text-[10px] md:text-xs uppercase tracking-widest border border-white/5 active:scale-95"
            >
              LƏĞV ET
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Standings;
