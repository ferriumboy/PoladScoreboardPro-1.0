import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Team } from '../types';
import { Type } from "@google/genai";
import { callGeminiWithRetry } from '../src/services/gemini';

interface PressCoverageModalProps {
  onClose: () => void;
  latestMatch: Match | null;
  teams: Team[];
}

interface NewsItem {
  id: string;
  outlet: string;
  logo: string;
  headline: string;
  excerpt: string;
  fullContent: string;
  timestamp: string;
  accentColor: string;
  style: 'bbc' | 'marca' | 'lequipe' | 'romano';
}

const PressCoverageModal: React.FC<PressCoverageModalProps> = ({ onClose, latestMatch, teams }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!latestMatch) {
        setIsLoading(false);
        return;
      }

      const home = teams.find(t => t.id === latestMatch.homeTeamId);
      const away = teams.find(t => t.id === latestMatch.awayTeamId);
      if (!home || !away) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const homeScore = latestMatch.homeScore || 0;
        const awayScore = latestMatch.awayScore || 0;
        
        const prompt = `Sən dünya şöhrətli futbol jurnalistisən. Aşağıdakı oyun nəticəsi üçün 4 fərqli media qurumu (BBC Sport, MARCA, L'Equipe, Fabrizio Romano) adından Azərbaycan dilində xəbərlər hazırlamalısan.
        Oyun: ${home.name} ${homeScore} - ${awayScore} ${away.name}
        
        Hər bir xəbər üçün:
        1. Headline: Dramatik və diqqətçəkən başlıq.
        2. Excerpt: 1-2 cümləlik qısa xülasə.
        3. FullContent: 3-4 cümləlik ətraflı məqalə.
        
        Media üslubları:
        - BBC Sport: Analitik, ciddi.
        - MARCA: Ehtiraslı, dramatik (xüsusilə uduzan tərəf üçün).
        - L'Equipe: Tənqidi, reytinq yönümlü.
        - Fabrizio Romano: "Here we go" üslubunda, insayder məlumatları.
        
        Cavabı JSON formatında ver:
        [
          { "outlet": "BBC Sport", "headline": "...", "excerpt": "...", "fullContent": "..." },
          ...
        ]`;

        const response = await callGeminiWithRetry({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  outlet: { type: Type.STRING },
                  headline: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  fullContent: { type: Type.STRING }
                },
                required: ["outlet", "headline", "excerpt", "fullContent"]
              }
            }
          }
        });

        const data = JSON.parse(response.text);
        const outlets = {
          'BBC Sport': { logo: 'https://www.bbc.co.uk/favicon.ico', color: '#FFD700', style: 'bbc' as const },
          'MARCA': { logo: 'https://www.marca.com/favicon.ico', color: '#FF0000', style: 'marca' as const },
          "L'Equipe": { logo: 'https://www.lequipe.fr/favicon.ico', color: '#E20613', style: 'lequipe' as const },
          'Fabrizio Romano': { logo: 'https://pbs.twimg.com/profile_images/1486761402853380113/3f7fX_t8_400x400.jpg', color: '#1DA1F2', style: 'romano' as const }
        };

        const generatedNews: NewsItem[] = data.map((item: any, index: number) => ({
          id: String(index + 1),
          outlet: item.outlet,
          logo: (outlets as any)[item.outlet]?.logo || '',
          headline: item.headline,
          excerpt: item.excerpt,
          fullContent: item.fullContent,
          timestamp: index === 0 ? 'İndi' : `${index * 2 + 1} dəq əvvəl`,
          accentColor: (outlets as any)[item.outlet]?.color || '#ffffff',
          style: (outlets as any)[item.outlet]?.style || 'bbc'
        }));

        setNews(generatedNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback to basic news if AI fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [latestMatch, teams]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#010412]/90 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        style={{ borderImage: 'linear-gradient(to bottom, rgba(255,215,0,0.3), rgba(255,255,255,0.1)) 1' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-gold/5 to-transparent">
          <div className="flex items-center gap-3">
            {selectedNews ? (
              <button 
                onClick={() => setSelectedNews(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all mr-2"
              >
                <span className="material-icons text-sm">arrow_back</span>
              </button>
            ) : (
              <div className="relative">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-600 rounded-full animate-ping opacity-75" />
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase">
              {selectedNews ? 'XƏBƏR' : 'SON'} <span className="text-gold">{selectedNews ? 'DETALI' : 'XƏBƏRLƏR'}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-gold font-black uppercase tracking-widest text-xs animate-pulse">Mətbuat İcmalı Hazırlanır...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!selectedNews ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {news.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => setSelectedNews(item)}
                      className="group relative bg-white/5 border border-white/10 rounded-2xl p-5 transition-all hover:bg-white/10 cursor-pointer"
                      style={{ 
                        boxShadow: `0 10px 30px -10px ${item.accentColor}20`,
                        borderLeft: `4px solid ${item.accentColor}`
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden border border-white/10">
                          <img 
                            src={item.logo} 
                            alt={item.outlet} 
                            className="w-full h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                              {item.outlet}
                              {item.style === 'romano' && (
                                <span className="ml-1 text-blue-400 material-icons text-[10px] align-middle">verified</span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-white/30 uppercase">
                              {item.timestamp}
                            </span>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-white leading-tight mb-2 group-hover:text-gold transition-colors">
                            {item.headline}
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-2 italic">
                            {item.excerpt}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="detail"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0 overflow-hidden border border-white/10">
                      <img 
                        src={selectedNews.logo} 
                        alt={selectedNews.outlet} 
                        className="w-full h-full object-contain p-2"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/60">
                          {selectedNews.outlet}
                        </span>
                        {selectedNews.style === 'romano' && (
                          <span className="text-blue-400 material-icons text-xs">verified</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white/30 uppercase">
                        Yayımlandı: {selectedNews.timestamp}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight italic">
                    {selectedNews.headline}
                  </h1>

                  <div className="w-full h-px bg-white/10 my-6" />

                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-slate-300 leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:text-gold first-letter:mr-3 first-letter:float-left">
                      {selectedNews.fullContent}
                    </p>
                  </div>

                  <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Paylaş</h4>
                    <div className="flex gap-3">
                      {['facebook', 'twitter', 'whatsapp'].map(social => (
                        <button key={social} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                          <span className="material-icons text-lg">share</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
            Qlobal Mətbuat İcmalı • Gemini AI tərəfindən dəstəklənir
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PressCoverageModal;
