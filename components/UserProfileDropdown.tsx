
import React from 'react';
import { Trophy, BarChart3, Shield, Settings, Info, LogOut } from 'lucide-react';
import { ProfileView } from '../types';

interface Props {
  user: any;
  onLogout: () => void;
  onClose: () => void;
  onSelectView: (view: ProfileView) => void;
}

const UserProfileDropdown: React.FC<Props> = ({ user, onLogout, onClose, onSelectView }) => {
  if (!user) return null;

  const handleSelect = (view: ProfileView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 premium-glass-card rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div className="w-12 h-12 rounded-full border-2 border-green-400/30 overflow-hidden shrink-0">
          <img src={user.photoURL || ""} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="text-sm font-black text-white truncate uppercase italic">{user.displayName}</span>
          <span className="text-[10px] font-bold text-slate-400 truncate">@{user.displayName?.toLowerCase().replace(/\s+/g, '_')}</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2 space-y-1">
        <button 
          onClick={() => handleSelect('tournaments')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-green-400 transition-all group"
        >
          <Trophy className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-bold uppercase tracking-widest">Mənim Turnirlərim</span>
        </button>
        <button 
          onClick={() => handleSelect('stats')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-green-400 transition-all group"
        >
          <BarChart3 className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-bold uppercase tracking-widest">Tarixçə və Statistika</span>
        </button>
        <button 
          onClick={() => handleSelect('preferences')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-green-400 transition-all group"
        >
          <Shield className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-bold uppercase tracking-widest">Komanda Üstünlükləri</span>
        </button>
        <button 
          onClick={() => handleSelect('settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-green-400 transition-all group"
        >
          <Settings className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-bold uppercase tracking-widest">Tətbiq Ayarları</span>
        </button>
        <button 
          onClick={() => handleSelect('help')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 hover:text-green-400 transition-all group"
        >
          <Info className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-bold uppercase tracking-widest">Qaydalar və Kömək</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/5">
        <button 
          onClick={() => handleSelect('logout')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
        >
          <LogOut className="w-4 h-4 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-black uppercase tracking-widest">Çıxış Et</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfileDropdown;
