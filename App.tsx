
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TournamentState, Team, TournamentMode, TournamentType, SavedTournament, Match, MatchStats, InterviewData, SocialPost, Standing, DirectMessage } from './types';
import { generateFixtures, calculateStandings, calculateGroupedStandings, updateTournamentState } from './utils/tournamentLogic';
import TournamentSetup from './components/TournamentSetup';
import Fixtures from './components/Fixtures';
import Standings from './components/Standings';
import WinnerOverlay from './components/WinnerOverlay';
import DrawScene from './components/DrawScene';
import WorldCupDrawScene from './components/WorldCupDrawScene';
import StatsDashboard from './components/StatsDashboard';
import FlashZone from './components/FlashZone';
import SocialFeedModal from './components/SocialFeedModal';
import PressCoverageModal from './components/PressCoverageModal';
import BracketView from './components/BracketView';
import UclKnockoutView from './components/UclKnockoutView';
import MatchStatsOverlay from './components/MatchStatsOverlay';
import IntroVideo from './components/IntroVideo';
import { Type, GoogleGenAI } from "@google/genai";
import { callGeminiWithRetry } from './src/services/gemini';
import { teamStadiums } from './data/stadiums';
import { allFootballClubs } from './data/clubs';

import DirectMessageModal from './components/DirectMessageModal';

const STORAGE_KEY = 'football_tournament_pro_v5_stable';
const HISTORY_KEY = 'football_tournament_history_v5_stable';

const getTeamCountry = (teamName: string): string => {
  for (const [groupName, clubs] of Object.entries(allFootballClubs)) {
    if (clubs.some(c => c.name === teamName)) {
      const parts = groupName.split('-');
      if (parts.length > 0) {
        return parts[0].replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]|[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83D][\uDE80-\uDEF3]|⭐/g, '').trim();
      }
    }
  }
  // Fallback: check if the name contains a country in parentheses
  const match = teamName.match(/\(([^)]+)\)/);
  if (match) return match[1];
  
  return "";
};

const App: React.FC = () => {
  const [viewingMenu, setViewingMenu] = useState(true);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<InterviewData | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  
  const [history, setHistory] = useState<SavedTournament[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("History parse failed", e);
      return [];
    }
  });
  
  const [state, setState] = useState<TournamentState>(() => {
    const initialState: TournamentState = {
      teams: [],
      matches: [],
      mode: TournamentMode.SINGLE,
      type: TournamentType.CHAMPIONS_LEAGUE,
      managerName: 'Baş məşqçi',
      isStarted: false,
      isDrawing: false,
      teamPlayers: {},
      socialFeed: []
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          teamPlayers: parsed.teamPlayers || {},
          socialFeed: parsed.socialFeed || [],
          teams: parsed.teams || [],
          matches: parsed.matches || []
        };
      }
    } catch (e) {
      console.error("State parse failed", e);
    }
    return initialState;
  });

  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showPressCoverage, setShowPressCoverage] = useState(false);
  const [activeStandingsView, setActiveStandingsView] = useState<'standings' | 'bracket'>('standings');
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    const source = state.type === TournamentType.WORLD_CUP
      ? "https://archive.org/download/fifa-world-cup-qatar-2022-official-soundtrack/Ozuna%2C%20GIMS%2C%20RedOne%2C%20FIFA%20Sound%20-%20Arhbo%20%5BMusic%20from%20the%20FIFA%20World%20Cup%20Qatar%202022%20Official%20Soundtrack%5D.mp3"
      : "https://archive.org/download/uefa-champions-league-anthem/UEFA%20Champions%20League%20Anthem.mp3";
      
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = 0.4;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.muted = isMuted;
    audioRef.current = audio;

    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [state.type]);

  const playAnthem = () => { 
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(e => console.error("Anthem play error:", e)); 
    }
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (audioRef.current) {
      audioRef.current.muted = newMuteState;
      if (!newMuteState) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);

  const isFinished = useMemo(() => 
    state.isStarted && state.matches.length > 0 && state.matches.every(m => m.isFinished), 
    [state.matches, state.isStarted]
  );

  const getTournamentWinner = (): Standing | null => {
    if (!isFinished) return null;
    if (state.mode === TournamentMode.SINGLE || state.mode === TournamentMode.HOME_AWAY) {
      return st[0] || null;
    } else {
      // For Knockout or Group+Knockout, the winner is the winner of the Final match
      const finalMatch = state.matches.find(m => m.stageName === 'Final');
      if (finalMatch && finalMatch.isFinished) {
        const winnerId = (finalMatch.homeScore || 0) >= (finalMatch.awayScore || 0) ? finalMatch.homeTeamId : finalMatch.awayTeamId;
        const winnerTeam = state.teams.find(t => t.id === winnerId);
        if (winnerTeam) {
          return {
            teamId: winnerTeam.id,
            teamName: winnerTeam.name,
            teamLogo: winnerTeam.logo,
            played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: []
          };
        }
      }
      return st[0] || null;
    }
  };

  useEffect(() => { 
    if (isFinished) {
      const timer = setTimeout(() => setShowWinner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  const generateMatchNews = async (match: Match) => {
    const home = state.teams.find(t => t.id === match.homeTeamId);
    const away = state.teams.find(t => t.id === match.awayTeamId);
    if (!home || !away) return;

    try {
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      const prompt = `Sən dünya şöhrətli bir futbol analitiki və peşəkar idman jurnalistisən. Bu oyunun nəticəsi haqqında sanki böyük bir xəbər portalında FLASH XƏBƏR BAŞLIĞI yazırsan.
      Oyun: ${home.name} ${homeScore} - ${awayScore} ${away.name}. 
      Cəmi 1 peşəkar, dramatik və manşet tipli cümlə yaz. Azərbaycan dilində olsun.`;

      const response = await callGeminiWithRetry({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      return `${home.name} və ${away.name} arasındakı qarşıdurma dramatik sonluqla bitdi.`;
    }
  };

  const generateInterview = async (match: Match) => {
    const home = state.teams.find(t => t.id === match.homeTeamId);
    const away = state.teams.find(t => t.id === match.awayTeamId);
    if (!home || !away) return;

    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;
    
    // Determine who is being interviewed (usually the loser, or the winner if it's a big win)
    const intervieweeTeam = awayScore > homeScore ? home : away;
    const opponentTeam = awayScore > homeScore ? away : home;
    const intervieweeName = state.managerName || "Məşqçi";

    const teamLocations: Record<string, { stadium: string, country: string }> = {
      "Real Madrid": { stadium: "Santiago Bernabéu", country: "İspaniya" },
      "Barcelona": { stadium: "Spotify Camp Nou", country: "İspaniya" },
      "Bayern Munich": { stadium: "Allianz Arena", country: "Almaniya" },
      "Manchester City": { stadium: "Etihad Stadium", country: "İngiltərə" },
      "Arsenal": { stadium: "Emirates Stadium", country: "İngiltərə" },
      "Liverpool": { stadium: "Anfield", country: "İngiltərə" },
      "Chelsea": { stadium: "Stamford Bridge", country: "İngiltərə" },
      "Manchester United": { stadium: "Old Trafford", country: "İngiltərə" },
      "Paris Saint-Germain": { stadium: "Parc des Princes", country: "Fransa" },
      "Juventus": { stadium: "Allianz Stadium", country: "İtaliya" },
      "AC Milan": { stadium: "San Siro", country: "İtaliya" },
      "Inter Milan": { stadium: "San Siro", country: "İtaliya" },
      "Napoli": { stadium: "Stadio Diego Armando Maradona", country: "İtaliya" },
      "Borussia Dortmund": { stadium: "Signal Iduna Park", country: "Almaniya" },
      "Bayer Leverkusen": { stadium: "BayArena", country: "Almaniya" },
      "Atletico Madrid": { stadium: "Cívitas Metropolitano", country: "İspaniya" },
      "Qarabağ FK": { stadium: "Tofiq Bəhramov adına Respublika Stadionu", country: "Azərbaycan" },
      "Galatasaray": { stadium: "RAMS Park", country: "Türkiyə" },
      "Fenerbahçe": { stadium: "Şükrü Saracoğlu Stadionu", country: "Türkiyə" },
      "Beşiktaş": { stadium: "Tüpraş Stadyumu", country: "Türkiyə" }
    };

    const locationInfo = teamLocations[home.name] || { stadium: "Milli Stadion", country: "Avropa" };
    const stadiumName = locationInfo.stadium;
    const teamCountry = locationInfo.country;

    const journalistPersonas = ["tənqidi", "tərifləyən", "təhrikedici", "taktiki", "maraqlı"];
    const persona = journalistPersonas[Math.floor(Math.random() * journalistPersonas.length)];

    try {
      const prompt = `Sən UEFA Çempionlar Liqasının rəsmi "Flash Zone" jurnalistisən. 
      Sənin bu günkü üslubun: ${persona}.
      Matç nəticəsi: ${home.name} ${homeScore} - ${awayScore} ${away.name}.
      Müsahibə verilən şəxs: ${intervieweeName} (${intervieweeTeam.name} komandasının baş məşqçisi).
      Məkan: ${stadiumName}, ${teamCountry}.
      
      Sənin vəzifən:
      1. Məşqçiyə matçın nəticəsinə uyğun (hesab, rəqib, oyunun gedişatı) 1 ədəd jurnalist sualı yaz.
      2. Bu sual üçün məşqçinin verə biləgəyi 3 fərqli cavab variantı hazırla:
         - 2 ədəd PEŞƏKAR (PROFESSIONAL) cavab: Taktiki analiz edən, rəqibi təbrik edən və ya gələcəyə baxan diplomatik cavablar.
         - 1 ədəd TROLL cavab: Hakimdən şikayət edən, bəhanə gətirən və ya aqressiv/gülməli cavab.
      3. Hər bir cavab variantına uyğun jurnalistin (sənin) qısa reaksiyasını yaz.
      
      QAYDALAR:
      - Cavablar QISA və KONKRET olsun.
      - Bütün mətnlər Azərbaycan dilində olsun.`;

      const response = await callGeminiWithRetry({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ["PROFESSIONAL", "TROLL"] },
                          reaction: { type: Type.STRING }
                        },
                        required: ["text", "type", "reaction"]
                      }
                    }
                  },
                  required: ["id", "question", "options"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const data = JSON.parse(response.text);
      if (data && data.questions && data.questions.length > 0) {
        setCurrentInterview({
          matchId: match.id,
          questions: data.questions,
          intervieweeName,
          intervieweeTeamLogo: intervieweeTeam.logo,
          homeTeamName: home.name,
          awayTeamName: away.name,
          homeScore,
          awayScore,
          homeScorers: (match as any).homeScorers || [],
          awayScorers: (match as any).awayScorers || [],
          mvp: (match as any).mvp || '',
          stadiumName,
          teamCountry
        });
      } else {
        console.error("No questions returned from AI");
        alert("Müsahibə hazırlana bilmədi. Yenidən yoxlayın.");
      }
    } catch (e) {
      console.error("Interview generation failed", e);
    }
  };

  const goToDraw = (teams: Team[], mode: TournamentMode, type: TournamentType, managerName: string) => {
    const enrichedTeams = teams.map(t => ({
      ...t,
      country: getTeamCountry(t.name)
    }));
    setState(prev => ({ ...prev, teams: enrichedTeams, mode, type, managerName, isDrawing: true, isStarted: false }));
    setViewingMenu(false);
    playAnthem();
  };

  const handleIntroComplete = () => {
    setShowIntroVideo(false);
    playAnthem();
  };

  const handleOpenDM = (handle: string, author: string, avatar: string) => {
    setState(prev => {
      const dmConversations = { ...(prev.dmConversations || {}) };
      if (!dmConversations[handle]) {
        dmConversations[handle] = {
          handle,
          author,
          avatar,
          messages: [
            {
              id: 'initial',
              senderId: handle,
              text: `Salam! Mən ${author}. Səninlə futbol haqqında danışmaq istəyirəm.`,
              timestamp: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
            }
          ],
          isBlocked: false,
          toxicityCount: 0,
          relationshipLevel: 10 // Start with some level
        };
      }
      return { ...prev, dmConversations };
    });
    setActiveDM(handle);
    setShowSocialFeed(true);
  };

  const handleSendMessage = async (handle: string, text: string) => {
    const conversation = state.dmConversations?.[handle];
    if (!conversation || conversation.isBlocked) return;
    const relationshipLevel = conversation.relationshipLevel ?? 10;

    const userMsg: DirectMessage = {
      id: Date.now().toString(),
      senderId: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
    };

    setState(prev => {
      const dmConversations = { ...(prev.dmConversations || {}) };
      dmConversations[handle] = {
        ...dmConversations[handle],
        messages: [...dmConversations[handle].messages, userMsg]
      };
      return { ...prev, dmConversations };
    });

    try {
      const prompt = `Sən İnstagramda "${conversation.author}" (@${handle}) adlı futbol azarkeşisən. 
      İstifadəçi sənə bu mesajı yazdı: "${text}".
      
      Sənin xarakterin: Futbolu çox sevən, bəzən emosional, amma ümumilikdə səmimi biridir.
      
      Əgər istifadəçi sənə qarşı təhqir, söyüş və ya çox kobud sözlər yazsa (pis sözlər), sən onu ciddi şəkildə təhdid et (məsələn: "Bir də belə yazsan səni bloklayacam!").
      Əgər istifadəçi artıq bir neçə dəfə xəbərdarlıq alıbsa və hələ də davam edirsə, cavabında mütləq "BLOK" sözünü işlət.
      
      Cavabı JSON formatında qaytar: { "reply": "...", "isToxic": boolean }`;

      const response = await callGeminiWithRetry({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      
      setState(prev => {
        const dmConversations = { ...(prev.dmConversations || {}) };
        const conv = dmConversations[handle];
        let newToxicityCount = conv.toxicityCount + (data.isToxic ? 1 : 0);
        let shouldBlock = data.reply.includes("BLOK") || newToxicityCount >= 3;

        const aiMsg: DirectMessage = {
          id: Date.now().toString() + 'ai',
          senderId: handle,
          text: shouldBlock ? "Səni blokladım! Bir daha mənə yazma." : data.reply,
          timestamp: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
        };

        dmConversations[handle] = {
          ...conv,
          messages: [...conv.messages, aiMsg],
          isBlocked: shouldBlock,
          toxicityCount: newToxicityCount,
          relationshipLevel: data.isToxic ? Math.max(0, relationshipLevel - 15) : Math.min(100, relationshipLevel + 5)
        };
        return { ...prev, dmConversations };
      });
    } catch (e) {
      console.error("DM AI response failed", e);
    }
  };

  const handleCallDM = async (handle: string) => {
    const conversation = state.dmConversations?.[handle];
    if (!conversation || conversation.isBlocked) return { status: 'rejected' };

    const now = Date.now();
    const lastCall = conversation.lastCallTime || 0;
    const within5Mins = (now - lastCall) < 5 * 60 * 1000;
    const callCount = within5Mins ? (conversation.callCount || 0) + 1 : 1;

    const responses = [
      "Salam, tanımadım, kim idi?",
      "Adboy verirəm də, deməli məşğulam. Nə lazımdı bura yazın, zəng eləməyin.",
      "Ay insan, söz başa düşmürsüz? Deyirəm axı danışa bilmirəm! Nə düşmüsüz adamın üstünə, nə lazımdır yazın da bura!",
      "Siz xəstəsiz-zadsız? Niyə dayanmadan yığırsız e?! Bir də zəng eləsəz, vallah bloka atacam, bezdirməyin adamı!",
      "Səninlə yaxşı dildə danışmaq olmur e deyəsən. Nə abırsız adamsan, get işinlə məşğul ol da! Nə istəyirsən məndən?!",
      "Rədd ol bloka."
    ];

    const responseText = responses[Math.min(callCount - 1, responses.length - 1)];
    const shouldBlock = callCount >= 6;

    const aiMsg: DirectMessage = {
      id: Date.now().toString() + 'call_resp',
      senderId: handle,
      text: responseText,
      timestamp: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
    };

    setState(prev => {
      const dmConversations = { ...(prev.dmConversations || {}) };
      dmConversations[handle] = {
        ...dmConversations[handle],
        messages: [...dmConversations[handle].messages, aiMsg],
        callCount: callCount,
        lastCallTime: now,
        isBlocked: shouldBlock || dmConversations[handle].isBlocked
      };
      return { ...prev, dmConversations };
    });

    return { status: 'rejected', message: responseText };
  };

  const handleDeleteMessage = (handle: string, messageId: string) => {
    setState(prev => {
      const dmConversations = { ...(prev.dmConversations || {}) };
      if (dmConversations[handle]) {
        dmConversations[handle] = {
          ...dmConversations[handle],
          messages: dmConversations[handle].messages.filter(m => m.id !== messageId)
        };
      }
      return { ...prev, dmConversations };
    });
  };

  const handleDeleteConversation = (handle: string) => {
    setState(prev => {
      const dmConversations = { ...(prev.dmConversations || {}) };
      delete dmConversations[handle];
      return { ...prev, dmConversations };
    });
    if (activeDM === handle) setActiveDM(null);
  };

  const finalizeDraw = (shuffledTeams: Team[]) => {
    const fixtures = generateFixtures(shuffledTeams, state.mode, state.type);
    setState(prev => ({ 
      ...prev, 
      teams: shuffledTeams, 
      matches: fixtures, 
      isDrawing: false, 
      isStarted: true 
    }));
    if (audioRef.current) audioRef.current.pause();
    setShowIntroVideo(true);
  };

  const generateSocialFeed = async (match: Match, homeScore: number, awayScore: number, homeScorers: string[], awayScorers: string[], mvp: string, managerAnswer: string) => {
    const home = state.teams.find(t => t.id === match.homeTeamId);
    const away = state.teams.find(t => t.id === match.awayTeamId);
    if (!home || !away) return;

    // Get team history for context
    const homeMatches = state.matches.filter(m => m.isFinished && (m.homeTeamId === home.id || m.awayTeamId === home.id));
    const awayMatches = state.matches.filter(m => m.isFinished && (m.homeTeamId === away.id || m.awayTeamId === away.id));

    let aggregateContext = "";
    if (match.isSecondLeg && match.firstLegMatchId) {
      const firstLeg = state.matches.find(m => m.id === match.firstLegMatchId);
      if (firstLeg && firstLeg.isFinished) {
        aggregateContext = `İlk oyunun nəticəsi: ${firstLeg.homeScore} - ${firstLeg.awayScore}.`;
      }
    }

    const prompt = `Sən 4 fərqli futbol azarkeşisən. Bu matçın nəticəsinə, oyunun əhəmiyyətinə və baş məşqçinin matçdan sonrakı müsahibəsinə uyğun 4 fərqli tvit (şərh) yaz.
    Oyun: ${home.name} ${homeScore} - ${awayScore} ${away.name}.
    Mərhələ: ${match.stageName || 'Normal Oyun'}.
    ${aggregateContext}
    Qol vuranlar: ${[...(homeScorers || []), ...(awayScorers || [])].join(', ')}.
    MVP: ${mvp}.
    Baş məşqçinin müsahibədə dediyi sözlər: "${managerAnswer}"
    
    Komanda Tarixçəsi:
    ${home.name}: Son ${homeMatches.length} oyunda ${homeMatches.filter(m => {
      const isHome = m.homeTeamId === home.id;
      return isHome ? (m.homeScore! > m.awayScore!) : (m.awayScore! > m.homeScore!);
    }).length} qələbə qazanıb.
    ${away.name}: Son ${awayMatches.length} oyunda ${awayMatches.filter(m => {
      const isHome = m.homeTeamId === away.id;
      return isHome ? (m.homeScore! > m.awayScore!) : (m.awayScore! > m.homeScore!);
    }).length} qələbə qazanıb.

    Xarakterlər:
    1. fanat: Çox loyal, amma uduzanda və ya pis oynayanda hamını (məşqçini, oyunçuları) sərt tənqid edən, qəzəbli azarkeş. Qazananda isə çox coşğulu. Məşqçinin dediklərinə reaksiya verir. Əgər Qarabağ FK haqqında yazırsa, onun bütün oyunlarını təhlil edib öz təəssüratlarını paylaşsın.
    2. analitik: Ciddi, rəqəmlərlə və taktika ilə danışan mütəxəssis. MVP və ya qol vuranları analiz edir, məşqçinin fikrinə peşəkar yanaşır. Oyunun turnir cədvəli üçün əhəmiyyətini vurğulayır.
    3. troll: Ancaq uduzanı ələ salan, gülməli və ironik "meme" yaradan profil. Məşqçini ələ salır.
    4. ucl: Beynəlxalq ingilis dilində şərhlər yazan rəsmi və ya qlobal azarkeş profili.
    
    Şərhlərdə hashtaglar (#) və emojilər istifadə et.
    Cavabı JSON formatında qaytar: { "fanat": "...", "analitik": "...", "troll": "...", "ucl": "..." }`;

    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fanat: { type: Type.STRING },
              analitik: { type: Type.STRING },
              troll: { type: Type.STRING },
              ucl: { type: Type.STRING }
            },
            required: ["fanat", "analitik", "troll", "ucl"]
          }
        }
      });

      const data = JSON.parse(response.text);
      
      const newPost: SocialPost = {
        id: Date.now().toString(),
        matchTitle: `${home.name} vs ${away.name}`,
        matchScore: `${homeScore} - ${awayScore}`,
        matchDetails: `Qollar: ${[...(homeScorers || []), ...(awayScorers || [])].join(', ')} | MVP: ${mvp}`,
        homeLogo: home.logo,
        awayLogo: away.logo,
        stadium: teamStadiums[home.name] || teamStadiums[away.name] || 'Milli Stadion',
        country: getTeamCountry(home.name) || getTeamCountry(away.name) || 'Avropa',
        timestamp: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
        comments: [
          {
            id: Date.now().toString() + '1',
            author: 'Fanat Bakili',
            handle: '@Fanat_Bakili',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCR1eU8q4tnc84oxD2nh30bCjwh60zUc_fwBtWAPjOv0yCbyFSqunxpSUm3b70kt9dMZpI_UjjvM-m8b5szuSWDRgNGY3mkm34a73KnJDt4lxWccsKmIVTzClrlD49OTC2GDH7o3-Ggf4yHfLLX3ptjL6wj8nVyuIA0L2qdHcPhAL0XJGUSzkdY95XAgnXzTso4kWrvMO5AI3nqfVYs-Y8L9QtuobPzM-D50riYVdUX1qw1Jz9JteFJrNOLYK-lGD4As7RSQue6Uo',
            content: data.fanat,
            likes: (Math.random() * 20 + 1).toFixed(1) + 'K'
          },
          {
            id: Date.now().toString() + '2',
            author: 'Futbol Analitiki',
            handle: '@FutbolAnalitiki',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLCADg80QOGWL_roiY_RkM1qnQBSnRWYTw6pV_cA2GFTOoKX2VpB_-EqnmmtkioKSGvf0wOencWp4J-qv-atenyb_2s3JEwkENME0O86i754vgzDdEZXuoMt7csM1o8lua-O_KXf6RBLTZKErwHjA_Qiyhsn8LuyQhUfKIrphH_uWQWwCCw-bmANMQBus4yg4TtnhwQRah-PpGm125E-90J0EyqVMEfoZWrRWaNTE7j6U4nXmXI1OxnzFtwXjsBFUbmfS36bYqLUw',
            content: data.analitik,
            likes: (Math.random() * 10 + 1).toFixed(1) + 'K'
          },
          {
            id: Date.now().toString() + '3',
            author: 'Troll Football',
            handle: '@Troll_Football',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3UrE8LJkTJbAv-vNlfgx4IvxwAsj4f2NZDIUgPmOgOSr8JOOJnBQ89_TE2Xf1AO7UvCdWwd7HdLfNaWt13lLpBWSIB4rnvPKaSQuS1Oxj6fGkBvQYWscgY1vRnCKWkuFLDT_wTHZW4PA8Ys27Yk_YusITOvzGtd3U1gYdLzQ8GDuj_BEslV8CyNMHxGpRoEmkIOQE73b84T7vQT5aCu7UwaR1NIAkbbaSw4ysUMCHNacq1TB7x6K8zGk4mxwyCVCqxQXUZUHoF6o',
            content: data.troll,
            likes: (Math.random() * 50 + 10).toFixed(1) + 'K'
          },
          {
            id: Date.now().toString() + '4',
            author: 'UCL Official Fan',
            handle: '@UCL_Official_Fan',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgyOY8R4YddvO0RAAoaNcydm4rAEKr37Tska0tHqxgxlWDeqV1JUXrV6t7AKmdfwesIu-JBOfw5ezAmKMePhkYWrPh9IzHrVbahfkicn6H-cAcLJcRH4YEODCFcXlhObQRqwIPnngbtavivAhNZbY5Ek6OMx0a5Mly-kxSYkepfWl7DVBj6-nAlT-VEkAjBV8nNNeDeOwevFP9lLHsOVMILCV10EM5dG-Fa6h_O0HqYQ0u27tcH33zPsNaugkzigiZ1ErCKuMJ4Bw',
            content: data.ucl,
            likes: (Math.random() * 30 + 5).toFixed(1) + 'K'
          }
        ]
      };

      setState(prev => ({
        ...prev,
        socialFeed: [newPost, ...(prev.socialFeed || [])]
      }));

    } catch (e) {
      console.error("Social feed generation failed", e);
    }
  };

  const updateMatchScore = async (matchId: string, updates: Partial<Match>) => {
    setState(prev => {
      const newTeamPlayers = { ...prev.teamPlayers };
      const currentMatch = prev.matches.find(m => m.id === matchId);
      
      if (currentMatch) {
        if (updates.homeScorers) {
          const tid = currentMatch.homeTeamId;
          newTeamPlayers[tid] = [...new Set([...(newTeamPlayers[tid] || []), ...updates.homeScorers.filter(n => n && n.trim())])];
        }
        if (updates.awayScorers) {
          const tid = currentMatch.awayTeamId;
          newTeamPlayers[tid] = [...new Set([...(newTeamPlayers[tid] || []), ...updates.awayScorers.filter(n => n && n.trim())])];
        }
        if (updates.mvp) {
           const hTid = currentMatch.homeTeamId;
           newTeamPlayers[hTid] = [...new Set([...(newTeamPlayers[hTid] || []), updates.mvp])];
        }
      }

      const updatedMatches = prev.matches.map(m => {
        if (m.id === matchId) {
          const updatedMatch = { ...m, ...updates };
          
          // Determine if penalties are needed
          let needsPenalty = false;
          if (updatedMatch.isKnockout && updatedMatch.homeScore !== null && updatedMatch.awayScore !== null) {
            if (updatedMatch.isSecondLeg && updatedMatch.firstLegMatchId) {
              const firstLeg = prev.matches.find(fm => fm.id === updatedMatch.firstLegMatchId);
              if (firstLeg && firstLeg.homeScore !== null && firstLeg.awayScore !== null) {
                const aggHome = (firstLeg.homeScore || 0) + (updatedMatch.awayScore || 0);
                const aggAway = (firstLeg.awayScore || 0) + (updatedMatch.homeScore || 0);
                if (aggHome === aggAway) needsPenalty = true;
              }
            } else if (!prev.matches.some(fm => fm.firstLegMatchId === updatedMatch.id)) {
              // Single leg
              if (updatedMatch.homeScore === updatedMatch.awayScore) needsPenalty = true;
            }
          }

          const hasScores = updatedMatch.homeScore !== null && updatedMatch.awayScore !== null;
          const hasPenaltyWinner = !needsPenalty || (updatedMatch.penaltyWinnerId !== undefined && updatedMatch.penaltyWinnerId !== null);
          
          // We still want MVP for "official" finish, but maybe advancement should happen anyway?
          // Let's keep isFinished for advancement, but make it depend on scores and penalties.
          const isNowFinished = hasScores && hasPenaltyWinner;
          
          return { ...updatedMatch, isFinished: isNowFinished };
        }
        return m;
      });

      return {
        ...prev,
        teamPlayers: newTeamPlayers,
        matches: updateTournamentState(updatedMatches, prev.teams)
      };
    });

    // We need to get the updated match to check if it's finished and generate news/interview
    setTimeout(async () => {
      setState(prev => {
        const currentMatchData = prev.matches.find(m => m.id === matchId);
        if (currentMatchData && currentMatchData.isFinished) {
          // Check if we already generated news
          if (!currentMatchData.aiNews) {
            generateMatchNews(currentMatchData).then(news => {
              setState(p => ({
                ...p,
                matches: p.matches.map(m => m.id === matchId ? { ...m, aiNews: news } : m)
              }));
            });
          }
        }
        return prev;
      });
    }, 0);
  };

  const saveTournament = (name: string) => {
    const st = calculateStandings(state.teams, state.matches);
    const newRecord: SavedTournament = { 
      id: Date.now().toString(), 
      name, 
      date: new Date().toLocaleString('az-AZ'), 
      standings: st, 
      matches: JSON.parse(JSON.stringify(state.matches)), 
      type: state.type 
    };
    setHistory(prev => [newRecord, ...prev]);
    alert('Turnir yaddaşa verildi!');
  };

  const st = useMemo(() => calculateStandings(state.teams, state.matches), [state.teams, state.matches, resetKey]);
  const groupedSt = useMemo(() => {
    if (state.mode === TournamentMode.GROUP_KNOCKOUT || state.mode === TournamentMode.LEAGUE_KNOCKOUT) {
      return calculateGroupedStandings(state.teams, state.matches);
    }
    return undefined;
  }, [state.teams, state.matches, state.mode, resetKey]);
  const showSetup = viewingMenu || (!state.isStarted && !state.isDrawing);

  return (
    <div className="min-h-screen flex flex-col ucl-bg-pattern font-display selection:bg-[#39FF14] selection:text-[#010412] transition-all duration-300" style={{ zoom: zoomLevel / 100 }}>
      {state.isStarted && !showSetup && !(state.type === TournamentType.CHAMPIONS_LEAGUE && state.mode === TournamentMode.KNOCKOUT && !state.isDrawing) && (
        <header className="relative z-10 border-b border-white/10 glass-panel-white px-2 md:px-8 py-2 md:py-5 flex items-center justify-between shadow-2xl backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-1 md:gap-4">
            <div className="w-6 h-6 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-lg ring-1 md:ring-2 ring-white/20">
              <span className="material-symbols-outlined text-[#001242] font-bold text-sm md:text-2xl">sports_soccer</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-xs md:text-2xl font-black tracking-tighter text-white leading-none">
                FUTBOL <span className="text-neon">PRO</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            {state.matches.some(m => m.isFinished) && (
              <button 
                onClick={() => setShowPressCoverage(true)} 
                className="group relative flex items-center gap-1 px-2 py-1 md:px-4 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-r from-[#facc15] to-[#f97316] text-[#010412] font-black text-[8px] md:text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:scale-105 transition-all animate-pulse hover:animate-none"
                title="Qlobal Mətbuat Reaksiyaları"
              >
                <span className="material-symbols-outlined text-xs md:text-base">newspaper</span>
                <span className="hidden md:inline">MƏTBUAT</span>
              </button>
            )}
            <button 
              onClick={() => setShowSocialFeed(true)} 
              className="w-7 h-7 md:w-11 md:h-11 flex items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white hover:scale-110 transition-all shadow-lg shadow-purple-500/20"
              title="Sosial Media"
            >
              <span className="material-symbols-outlined text-sm md:text-xl">photo_camera</span>
            </button>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-1">
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
                title="Kiçilt"
              >
                <span className="material-symbols-outlined text-sm md:text-lg">zoom_out</span>
              </button>
              <span className="text-[10px] md:text-xs font-black text-white w-8 md:w-12 text-center">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-all"
                title="Böyüt"
              >
                <span className="material-symbols-outlined text-sm md:text-lg">zoom_in</span>
              </button>
            </div>
            <button 
              onClick={() => setShowStatsDashboard(true)} 
              className="w-7 h-7 md:w-auto md:px-5 md:py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg md:rounded-xl border border-emerald-500/20 transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm md:text-xl md:hidden">bar_chart</span>
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Statistika</span>
            </button>
            <button 
              onClick={() => setViewingMenu(true)} 
              className="w-7 h-7 md:w-auto md:px-6 md:py-2.5 rounded-lg md:rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm md:text-xl md:hidden">menu</span>
              <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Menyu</span>
            </button>
          </div>
        </header>
      )}

      {showStatsDashboard && (
        <StatsDashboard 
          onClose={() => setShowStatsDashboard(false)} 
          teams={state.teams} 
          matches={state.matches} 
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
        />
      )}

      {selectedMatchId && (
        <MatchStatsOverlay 
          match={state.matches.find(m => m.id === selectedMatchId)!} 
          allMatches={state.matches}
          homeTeam={state.teams.find(t => t.id === state.matches.find(m => m.id === selectedMatchId)?.homeTeamId)!}
          awayTeam={state.teams.find(t => t.id === state.matches.find(m => m.id === selectedMatchId)?.awayTeamId)!}
          teamPlayers={state.teamPlayers || {}}
          onUpdateScore={updateMatchScore}
          onStartInterview={generateInterview}
          onClose={() => setSelectedMatchId(null)} 
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
        />
      )}

      {state.type === TournamentType.CHAMPIONS_LEAGUE && (state.mode === TournamentMode.KNOCKOUT || state.mode === TournamentMode.LEAGUE_KNOCKOUT) && !showSetup && !state.isDrawing ? (
        <UclKnockoutView 
          state={state} 
          onMatchClick={setSelectedMatchId} 
          onOpenStats={() => setShowStatsDashboard(true)} 
          onOpenSocial={() => setShowSocialFeed(true)} 
          onOpenMenu={() => setViewingMenu(true)} 
        />
      ) : (
        <main className="flex-grow container mx-auto px-1 md:px-6 py-2 md:py-10 relative z-10">
          {showSetup ? (
            <TournamentSetup 
              onStart={goToDraw} 
              initialTeams={state.teams} 
              initialType={state.type}
              initialMode={state.mode}
              history={history} 
              hasExistingTournament={state.isStarted} 
              onResume={() => setViewingMenu(false)} 
              isMuted={isMuted} 
              onToggleMute={toggleMute} 
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onOpenSocialFeed={() => setShowSocialFeed(true)}
            />
          ) : state.isDrawing ? (
            state.type === TournamentType.WORLD_CUP ? (
              <WorldCupDrawScene 
                teams={state.teams} 
                mode={state.mode}
                onFinish={finalizeDraw} 
                onStartMusic={playAnthem} 
                isMuted={isMuted} 
                onToggleMute={toggleMute} 
                onBackToMenu={() => setViewingMenu(true)} 
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onOpenSocialFeed={() => setShowSocialFeed(true)}
              />
            ) : (
              <DrawScene 
                teams={state.teams} 
                onFinish={finalizeDraw} 
                onStartMusic={playAnthem} 
                isMuted={isMuted} 
                onToggleMute={toggleMute} 
                onBackToMenu={() => setViewingMenu(true)} 
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                onOpenSocialFeed={() => setShowSocialFeed(true)}
              />
            )
          ) : (
            <div key={resetKey} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 animate-in fade-in duration-700">
            {activeStandingsView === 'standings' && (
              <section className="lg:col-span-5 flex flex-col gap-4 md:gap-6 order-2 lg:order-1 animate-in slide-in-from-left duration-500">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 md:h-8 bg-neon rounded-full shadow-neon"></div>
                   <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-widest text-white italic">Oyunlar</h2>
                 </div>
                 <Fixtures 
                    matches={state.matches} 
                    teams={state.teams} 
                    teamPlayers={state.teamPlayers} 
                    onUpdateScore={updateMatchScore} 
                    onStartInterview={generateInterview}
                    type={state.type}
                    zoomLevel={zoomLevel}
                    onZoomChange={setZoomLevel}
                    onMatchClick={setSelectedMatchId}
                 />
              </section>
            )}
            <section className={`${activeStandingsView === 'standings' ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-4 md:gap-6 order-1 lg:order-2 transition-all duration-500`}>
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 md:h-8 bg-neon rounded-full shadow-neon"></div>
                 <h2 className="font-display text-xl md:text-2xl font-black uppercase tracking-widest text-white italic">Cədvəl</h2>
               </div>
               {state.mode === TournamentMode.KNOCKOUT ? (
                 <div className="premium-glass-card rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden bg-[#020d2d] border border-white/10">
                   <div className="flex items-center justify-between mb-6 md:mb-10">
                     <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-neon animate-pulse"></div>
                        <span className="text-[9px] md:text-[11px] font-black text-neon uppercase tracking-[0.2em] italic">PLEY-OFF AĞACI</span>
                     </div>
                   </div>
                   <BracketView 
                     matches={state.matches.filter(m => m.isKnockout)} 
                     teams={state.teams} 
                     onMatchClick={setSelectedMatchId} 
                   />
                 </div>
               ) : (
                 <div className="flex flex-col gap-6">
                   {activeStandingsView === 'standings' ? (
                     <Standings standings={st} groupedStandings={groupedSt} onSave={saveTournament} isFinished={isFinished} />
                   ) : (
                     <div className="premium-glass-card rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden bg-[#020d2d] border border-white/10 animate-in fade-in zoom-in duration-500">
                       <div className="flex items-center justify-between mb-6 md:mb-10">
                         <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-neon animate-pulse"></div>
                            <span className="text-[9px] md:text-[11px] font-black text-neon uppercase tracking-[0.2em] italic">PLEY-OFF AĞACI</span>
                         </div>
                       </div>
                       <BracketView 
                         matches={state.matches.filter(m => m.isKnockout)} 
                         teams={state.teams} 
                         onMatchClick={setSelectedMatchId} 
                       />
                     </div>
                   )}

                   {(state.mode === TournamentMode.GROUP_KNOCKOUT || state.mode === TournamentMode.LEAGUE_KNOCKOUT) && (
                     <div className="flex items-center justify-center gap-2 md:gap-4 mt-2">
                       <button 
                         onClick={() => setActiveStandingsView('standings')}
                         className={`flex-1 md:flex-none md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeStandingsView === 'standings' ? 'bg-neon text-[#010412] shadow-[0_0_20px_rgba(57,255,20,0.4)]' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                       >
                         Liqa Mərhələsi
                       </button>
                       <button 
                         onClick={() => setActiveStandingsView('bracket')}
                         className={`flex-1 md:flex-none md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeStandingsView === 'bracket' ? 'bg-neon text-[#010412] shadow-[0_0_20px_rgba(57,255,20,0.4)]' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                       >
                         Pley-off
                       </button>
                     </div>
                   )}
                 </div>
               )}
            </section>
          </div>
          )}
        </main>
      )}

      {!(state.type === TournamentType.CHAMPIONS_LEAGUE && state.mode === TournamentMode.KNOCKOUT && !showSetup && !state.isDrawing) && (
        <footer className="mt-auto p-6 md:p-8 border-t border-white/5 glass-panel-white text-center">
          <p className="font-mono text-[10px] md:text-[11px] tracking-[0.5em] text-white/30 uppercase font-bold">
             Hazırladı <span className="text-neon">Polad</span>
          </p>
        </footer>
      )}
      {showWinner && getTournamentWinner() && <WinnerOverlay winner={getTournamentWinner()!} onClose={() => setShowWinner(false)} />}
      {showSocialFeed && (
        <SocialFeedModal 
          onClose={() => setShowSocialFeed(false)} 
          posts={state.socialFeed || []} 
          zoomLevel={zoomLevel} 
          onZoomChange={setZoomLevel} 
          onOpenDM={handleOpenDM}
          activeDM={activeDM}
          dmConversations={state.dmConversations || {}}
          onSendMessage={handleSendMessage}
          onCall={handleCallDM}
          onSelectConversation={(handle) => setActiveDM(handle)}
          onDeleteMessage={handleDeleteMessage}
          onDeleteConversation={handleDeleteConversation}
        />
      )}
      {showPressCoverage && (
        <PressCoverageModal 
          onClose={() => setShowPressCoverage(false)} 
          latestMatch={state.matches.filter(m => m.isFinished).sort((a, b) => (b.id > a.id ? 1 : -1))[0] || null}
          teams={state.teams}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
        />
      )}
      <IntroVideo isActive={showIntroVideo} isMuted={isMuted} onComplete={handleIntroComplete} />
      {currentInterview && (
        <FlashZone 
          data={currentInterview} 
          onComplete={(selectedOption) => {
            setCurrentInterview(null);
            const match = state.matches.find(m => m.id === currentInterview.matchId);
            if (match) {
              generateSocialFeed(
                match, 
                currentInterview.homeScore, 
                currentInterview.awayScore, 
                currentInterview.homeScorers, 
                currentInterview.awayScorers, 
                currentInterview.mvp, 
                selectedOption ? selectedOption.text : "Şərh yoxdur."
              );
            }
          }} 
        />
      )}
    </div>
  );
};

export default App;
