
import React, { useState, useRef } from 'react';
import { Match, Team, MatchStats } from '../types';
import { globalPlayers } from '../data/players';
import { teamStadiums } from '../data/stadiums';
import { allFootballClubs } from '../data/clubs';
import MatchSummaryModal from './MatchSummaryModal';
import html2canvas from 'html2canvas';
import { callGeminiWithRetry } from '../src/services/gemini';
import { Type } from "@google/genai";

interface Props {
  match: Match;
  allMatches: Match[];
  homeTeam: Team;
  awayTeam: Team;
  teamPlayers: Record<string, string[]>;
  tournamentId?: string;
  onUpdateScore: (id: string, updates: Partial<Match>) => void;
  onStartInterview: (match: Match) => void;
  onClose: () => void;
  canEdit?: boolean;
}

const getTeamCountry = (teamName: string): string => {
  for (const [groupName, clubs] of Object.entries(allFootballClubs)) {
    if (clubs.some(c => c.name === teamName)) {
      // Extract country name from group name (e.g., "🇩🇪 Almaniya - Bundesliga" -> "Almaniya")
      const parts = groupName.split('-');
      if (parts.length > 0) {
        // Remove the flag emoji and trim
        return parts[0].replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEF3]|⭐/g, '').trim();
      }
    }
  }
  return "";
};

const MatchStatsOverlay: React.FC<Props> = ({ match, allMatches, homeTeam, awayTeam, teamPlayers, tournamentId, onUpdateScore, onStartInterview, onClose, canEdit = true }) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/16/16480.png";

  const currentStats: MatchStats = match.stats || {
    possessionHome: 50, possessionAway: 50,
    shotsHome: 0, shotsAway: 0,
    onTargetHome: 0, onTargetAway: 0,
    savesHome: 0, savesAway: 0,
    cornersHome: 0, cornersAway: 0,
    offsidesHome: 0, offsidesAway: 0,
    passesHome: 0, passesAway: 0,
    foulsHome: 0, foulsAway: 0,
    freeKicksHome: 0, freeKicksAway: 0,
    successfulPassesHome: 0, successfulPassesAway: 0,
    crossesHome: 0, crossesAway: 0,
    interceptionsHome: 0, interceptionsAway: 0,
    tacklesHome: 0, tacklesAway: 0
  };

  const handleStatChange = (field: keyof MatchStats, val: number | null) => {
    const finalVal = val === null ? 0 : val;
    const newStats = { ...currentStats, [field]: finalVal };
    onUpdateScore(match.id, { stats: newStats });
  };

  const handleTakeScreenshot = async () => {
    if (!statsRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(statsRef.current, {
        backgroundColor: '#050e1c',
        scale: 2,
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `match-stats-${match.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Screenshot error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const prompt = `Bu şəkildəki futbol matçı statistikalarını analiz et və aşağıdakı JSON formatında qaytar. 
        Yalnız JSON qaytar, başqa heç nə yazma.
        
        JSON formatı:
        {
          "possessionHome": number, "possessionAway": number,
          "shotsHome": number, "shotsAway": number,
          "onTargetHome": number, "onTargetAway": number,
          "savesHome": number, "savesAway": number,
          "cornersHome": number, "cornersAway": number,
          "offsidesHome": number, "offsidesAway": number,
          "passesHome": number, "passesAway": number,
          "foulsHome": number, "foulsAway": number,
          "freeKicksHome": number, "freeKicksAway": number,
          "successfulPassesHome": number, "successfulPassesAway": number,
          "crossesHome": number, "crossesAway": number,
          "interceptionsHome": number, "interceptionsAway": number,
          "tacklesHome": number, "tacklesAway": number
        }`;

        const response = await callGeminiWithRetry({
          model: "gemini-2.0-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedStats = JSON.parse(jsonMatch[0]);
          onUpdateScore(match.id, { stats: { ...currentStats, ...parsedStats } });
          alert('Statistikalar uğurla yükləndi!');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Statistikaları oxumaq mümkün olmadı.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isHomeWinner = (match.homeScore || 0) > (match.awayScore || 0);
  const isAwayWinner = (match.awayScore || 0) > (match.homeScore || 0);

  let aggregateText = "";
  let needsPenalty = false;
  if (match.isKnockout) {
    if (match.isSecondLeg && match.firstLegMatchId) {
      const firstLeg = allMatches.find(m => m.id === match.firstLegMatchId);
      if (firstLeg) {
        const aggHome = (firstLeg.homeScore || 0) + (match.awayScore || 0);
        const aggAway = (firstLeg.awayScore || 0) + (match.homeScore || 0);
        aggregateText = `Ümumi Hesab: ${aggAway} - ${aggHome}`;
        if (aggHome === aggAway && match.homeScore !== null && match.awayScore !== null) {
          needsPenalty = true;
        }
      }
    } else if (!allMatches.some(m => m.firstLegMatchId === match.id)) {
      if (match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore) {
        needsPenalty = true;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-background font-body overflow-y-auto animate-in fade-in zoom-in duration-300 text-on-background dark">
      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-[#131c2a]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(177,198,252,0.12)]">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1920px] mx-auto">
          <div className="flex flex-col">
            <div className="text-lg md:text-2xl font-black italic tracking-tighter text-[#f5fff2] font-headline">UEFA CHAMPIONS LEAGUE</div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-[#b1c6fc]">
            <button onClick={onClose} className="p-2 hover:bg-[#2c3544]/50 rounded-full transition-all duration-300 active:scale-95 flex items-center gap-2">
              <span className="material-symbols-outlined">close</span>
              <span className="hidden md:inline font-bold text-sm uppercase tracking-widest">Bağla</span>
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-b from-[#17202e] to-transparent h-px w-full"></div>
      </header>

      <main className="pt-24 min-h-screen max-w-[1400px] mx-auto px-4 md:px-8 pb-24 md:pb-12">
        {/* Match Summary Header */}
        <section className="relative overflow-hidden rounded-[2rem] mb-8 group">
          <div className="absolute inset-0 z-0">
            <img alt="Atmospheric stadium view" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 opacity-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3zOL1Ef3BSDm13Pnuv6EKl8FV-2QDWOD4CoGFRJuhfHa8bMJSLC5DJIh7nIFTEAEMSMSYc7tpLLZIIxjlvqmJd7HI6JYGxr8Fi9vHFw_bPMnZUJ3fplgwTERpstSLrCKjOGtVcvmfzqEsa9zY8rqqPpQISxAeea1gMnCtK0iv4o7-Ur143QvLcSJ5Jz7NhASeGX7oJoL-YH6GXs9Aq1K7e_c3BqVjVGYUxCw5ZaQBptehTrpjtqo5TddUiq9I_CIxQiHa391KsKo"/>
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
          </div>
          <div className="relative z-10 p-6 md:p-12 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-secondary-fixed/20 text-secondary-fixed rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-secondary-fixed/30">CANLI</span>
              <span className="font-headline text-xs md:text-sm font-bold text-on-surface-variant tracking-widest uppercase">{match.stageName || 'UEFA Champions League'}</span>
            </div>
            
            {aggregateText && (
              <div className="mb-6 px-4 py-1 bg-secondary-fixed/20 border border-secondary-fixed/30 rounded-full text-secondary-fixed text-[10px] font-black uppercase tracking-widest">
                {aggregateText}
              </div>
            )}

            <div className="flex items-center justify-between w-full max-w-4xl gap-4 md:gap-12">
              {/* Home Team */}
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <div className="w-16 h-16 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-b from-primary/30 to-transparent mb-3 shadow-lg">
                  <img alt={homeTeam.name} className="w-full h-full object-cover rounded-full" src={homeTeam.logo || DEFAULT_LOGO}/>
                </div>
                <h2 className="font-headline text-xs md:text-2xl font-extrabold tracking-tight leading-tight text-white truncate w-full uppercase">{homeTeam.name}</h2>
              </div>
              
              {/* Score Section */}
              <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center gap-2 md:gap-6">
                  <div className="flex flex-col items-center">
                    <input 
                      type="number"
                      value={match.homeScore ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onUpdateScore(match.id, { homeScore: isNaN(val) ? null : val });
                      }}
                      className={`w-12 md:w-24 h-12 md:h-24 bg-white/5 border border-white/10 text-center outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl text-2xl md:text-6xl font-black italic text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="-"
                    />
                  </div>
                  
                  <span className="text-primary opacity-30 text-2xl md:text-6xl font-black">:</span>
                  
                  <div className="flex flex-col items-center">
                    <input 
                      type="number"
                      value={match.awayScore ?? ''}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onUpdateScore(match.id, { awayScore: isNaN(val) ? null : val });
                      }}
                      className={`w-12 md:w-24 h-12 md:h-24 bg-white/5 border border-white/10 text-center outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl text-2xl md:text-6xl font-black italic text-white ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="-"
                    />
                  </div>
                </div>
                
                <div className="mt-4 px-4 py-1 bg-primary/20 border border-primary/30 rounded-full text-[8px] md:text-xs font-black text-primary uppercase tracking-widest">
                  {match.isFinished ? 'OYUN BİTDİ' : "CANLI • 90'"}
                </div>
              </div>
              
              {/* Away Team */}
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <div className="w-16 h-16 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-b from-primary/30 to-transparent mb-3 shadow-lg">
                  <img alt={awayTeam.name} className="w-full h-full object-cover rounded-full" src={awayTeam.logo || DEFAULT_LOGO}/>
                </div>
                <h2 className="font-headline text-xs md:text-2xl font-extrabold tracking-tight leading-tight text-white truncate w-full uppercase">{awayTeam.name}</h2>
              </div>
            </div>

            {needsPenalty && (
              <div className="mt-8 w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black text-secondary-fixed uppercase tracking-[0.2em] italic">PENALTİ SERİYASI QALİBİ</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => canEdit && onUpdateScore(match.id, { penaltyWinnerId: homeTeam.id })}
                    disabled={!canEdit}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black italic uppercase tracking-widest text-xs ${match.penaltyWinnerId === homeTeam.id ? 'bg-secondary-fixed border-secondary-fixed text-on-secondary-fixed' : 'bg-white/5 border-white/10 text-white hover:border-secondary-fixed/50'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {homeTeam.name}
                  </button>
                  <button 
                    onClick={() => canEdit && onUpdateScore(match.id, { penaltyWinnerId: awayTeam.id })}
                    disabled={!canEdit}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black italic uppercase tracking-widest text-xs ${match.penaltyWinnerId === awayTeam.id ? 'bg-secondary-fixed border-secondary-fixed text-on-secondary-fixed' : 'bg-white/5 border-white/10 text-white hover:border-secondary-fixed/50'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {awayTeam.name}
                  </button>
                </div>
              </div>
            )}
            
            {/* Stadium and Country Info - Centered below logos */}
            <div className="flex flex-col items-center mt-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[10px] md:text-xs text-neon">location_on</span>
                <span className="text-[8px] md:text-[10px] font-black text-white/70 uppercase tracking-widest">
                  {teamStadiums[homeTeam.name] || 'Ev Stadionu'}
                  {getTeamCountry(homeTeam.name) ? `, ${getTeamCountry(homeTeam.name)}` : ''}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
          {/* Statistics Table */}
          <div className="lg:col-span-8 space-y-6">
            <div ref={statsRef} className="glass-panel rounded-[2rem] p-6 md:p-8 shadow-2xl bg-[#050e1c] border border-white/10 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#b1c6fc 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-end mb-8">
                  <h3 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight uppercase text-white">Matç Statistikası</h3>
                  <span className="font-label text-[8px] md:text-[10px] text-[#b1c6fc]/40 tracking-[0.3em] uppercase">Rəsmi Məlumatlar</span>
                </div>
                
                <div className="space-y-4">
                  <StatInputRow 
                    label="Topa sahiblik" 
                    homeVal={currentStats.possessionHome} 
                    awayVal={currentStats.possessionAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('possessionHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('possessionAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner}
                    isPercentage={true}
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Ümumi zərbələr" 
                    homeVal={currentStats.shotsHome} 
                    awayVal={currentStats.shotsAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('shotsHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('shotsAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Çərçivəyə zərbə" 
                    homeVal={currentStats.onTargetHome} 
                    awayVal={currentStats.onTargetAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('onTargetHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('onTargetAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Seyvlər" 
                    homeVal={currentStats.savesHome} 
                    awayVal={currentStats.savesAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('savesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('savesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Künc zərbələri" 
                    homeVal={currentStats.cornersHome} 
                    awayVal={currentStats.cornersAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('cornersHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('cornersAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Ofsaydlar" 
                    homeVal={currentStats.offsidesHome} 
                    awayVal={currentStats.offsidesAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('offsidesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('offsidesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Ötürmələr" 
                    homeVal={currentStats.passesHome} 
                    awayVal={currentStats.passesAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('passesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('passesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Qayda pozuntusu" 
                    homeVal={currentStats.foulsHome} 
                    awayVal={currentStats.foulsAway} 
                    onHomeChange={(v) => canEdit && handleStatChange('foulsHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('foulsAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Cərimə zərbələri" 
                    homeVal={currentStats.freeKicksHome || 0} 
                    awayVal={currentStats.freeKicksAway || 0} 
                    onHomeChange={(v) => canEdit && handleStatChange('freeKicksHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('freeKicksAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Uğurlu ötürmələr" 
                    homeVal={currentStats.successfulPassesHome || 0} 
                    awayVal={currentStats.successfulPassesAway || 0} 
                    onHomeChange={(v) => canEdit && handleStatChange('successfulPassesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('successfulPassesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Cinah ötürmələri" 
                    homeVal={currentStats.crossesHome || 0} 
                    awayVal={currentStats.crossesAway || 0} 
                    onHomeChange={(v) => canEdit && handleStatChange('crossesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('crossesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Top qapma" 
                    homeVal={currentStats.interceptionsHome || 0} 
                    awayVal={currentStats.interceptionsAway || 0} 
                    onHomeChange={(v) => canEdit && handleStatChange('interceptionsHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('interceptionsAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                  <StatInputRow 
                    label="Müdaxilələr" 
                    homeVal={currentStats.tacklesHome || 0} 
                    awayVal={currentStats.tacklesAway || 0} 
                    onHomeChange={(v) => canEdit && handleStatChange('tacklesHome', v)} 
                    onAwayChange={(v) => canEdit && handleStatChange('tacklesAway', v)} 
                    highlightHome={isHomeWinner} 
                    highlightAway={isAwayWinner} 
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleTakeScreenshot}
                disabled={isCapturing}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{isCapturing ? 'hourglass_empty' : 'photo_camera'}</span>
                {isCapturing ? 'ŞƏKİL ÇƏKİLİR...' : 'ŞƏKLİ ÇƏK'}
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl font-bold text-xs uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{isUploading ? 'sync' : 'upload_file'}</span>
                {isUploading ? 'OXUNUR...' : 'ŞƏKİL YÜKLƏ'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUploadImage} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          {/* Flash Zone / Press Conference Side */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="relative overflow-hidden rounded-[2rem] aspect-[4/5] glass-panel group">
              <div className="absolute inset-0">
                <img alt="Press Conference" className="w-full h-full object-cover blur-sm group-hover:blur-none transition-all duration-700 opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAlS8N4RH0TNhukCIDA8yXJcAVjl5GV3NcPlibIaeQgs3GeXQtxkUzYGOZ-P8oAtTr4Q5_-d1fPSo1uQFBVH6M60hwqggn7czXsNtohiBEENcVdLEI0oxfYXo1JqtMRc1BETItUCHzRTZYIWbzcMdWeV8zzSi6qGHhtciK54bl3e2paZ8UcHx9aQYMd0FHJwvDAPkDHh8XMnaCCiRwZOBIA8EgjZ_iiGjhzGc745avDfBUcvoqvSPzTYfblnzXkaiXykXHzhVD0rA"/>
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"></div>
              </div>
              <div className="relative z-10 h-full p-8 flex flex-col">
                <div className="mb-auto">
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4">Eksklüziv</span>
                  <h4 className="font-headline text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase">Flash Zone:<br/>Matçdan Sonra</h4>
                </div>
                <div className="space-y-6">
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Baş məşqçilərin oyundan dərhal sonra verdiyi açıqlamalar və matçın təhlili canlı yayımda.
                  </p>
                  <button 
                    onClick={() => {
                      setIsLoadingInterview(true);
                      setTimeout(() => {
                        onStartInterview(match);
                      }, 2500);
                    }}
                    disabled={isLoadingInterview}
                    className="w-full group/btn relative flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-primary to-on-tertiary-container rounded-2xl font-headline font-black text-xs md:text-sm uppercase tracking-widest text-on-primary transition-all duration-300 hover:shadow-[0_0_30px_rgba(177,198,252,0.4)] active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xl">mic_external_on</span>
                    {isLoadingInterview ? 'HAZIRLANIR...' : 'MƏTBUAT KONFRANSINA KEÇİD'}
                    <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover/btn:border-white/40 transition-colors"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Small Secondary Action */}
            <div onClick={() => setShowSummaryModal(true)} className="glass-panel p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed/10 flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined">videocam</span>
                </div>
                <div>
                  <p className="font-headline text-sm font-bold uppercase tracking-tight">Oyunun Özəti</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">4K Ultra HD • 12:40</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary-fixed group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>
          </div>
        </div>
      </main>

      {showSummaryModal && (
        <MatchSummaryModal
          match={match}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          teamPlayers={teamPlayers}
          tournamentId={tournamentId}
          onClose={() => setShowSummaryModal(false)}
          onUpdate={(details) => {
            onUpdateScore(match.id, details);
          }}
        />
      )}

      {isLoadingInterview && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-pulse">mic</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em] mb-2">Mətbuat konfransı hazırlanır</h2>
          <p className="text-primary/60 text-xs font-bold uppercase tracking-widest animate-pulse">Zəhmət olmasa gözləyin...</p>
        </div>
      )}
    </div>
  );
};

const StatInputRow: React.FC<{ 
  label: string, 
  homeVal: number, 
  awayVal: number, 
  onHomeChange: (v: number | null) => void, 
  onAwayChange: (v: number | null) => void,
  highlightHome: boolean,
  highlightAway: boolean,
  isPercentage?: boolean,
  disabled?: boolean
}> = ({ label, homeVal, awayVal, onHomeChange, onAwayChange, highlightHome, highlightAway, isPercentage, disabled }) => {
  const total = homeVal + awayVal;
  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
  const awayPct = total > 0 ? (awayVal / total) * 100 : 50;

  return (
    <div className={`group stat-row rounded-2xl p-4 transition-all ${disabled ? 'opacity-80' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <input 
            type="number" 
            value={homeVal === 0 && label !== "Topa sahiblik" ? "" : homeVal} 
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onHomeChange(isNaN(val) ? null : val);
            }}
            className={`bg-transparent border-none text-lg font-bold outline-none w-16 p-0 text-left ${highlightHome ? 'text-secondary-fixed shadow-[0_0_15px_rgba(97,255,151,0.2)]' : 'text-on-surface'} ${disabled ? 'cursor-not-allowed' : ''}`}
            placeholder="0"
          />
          {isPercentage && <span className="text-lg font-bold text-on-surface">%</span>}
        </div>
        
        <span className="font-headline text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant text-center px-2">{label}</span>
        
        <div className="flex items-center justify-end">
          <input 
            type="number" 
            value={awayVal === 0 && label !== "Topa sahiblik" ? "" : awayVal} 
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onAwayChange(isNaN(val) ? null : val);
            }}
            className={`bg-transparent border-none text-lg font-bold outline-none w-16 p-0 text-right ${highlightAway ? 'text-secondary-fixed shadow-[0_0_15px_rgba(97,255,151,0.2)]' : 'text-on-surface'} ${disabled ? 'cursor-not-allowed' : ''}`}
            placeholder="0"
          />
          {isPercentage && <span className="text-lg font-bold text-on-surface">%</span>}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="flex h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${homePct}%` }}></div>
        <div className="bg-secondary-fixed h-full transition-all duration-1000" style={{ width: `${awayPct}%` }}></div>
      </div>
    </div>
  );
};

export default MatchStatsOverlay;
