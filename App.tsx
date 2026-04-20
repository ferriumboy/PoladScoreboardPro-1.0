
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TournamentState, Team, TournamentMode, TournamentType, SavedTournament, Match, MatchStats, InterviewData, SocialPost, Standing, DirectMessage, ProfileView } from './types';
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
import UserProfileDropdown from './components/UserProfileDropdown';
import { MyTournaments, MatchHistory, TeamPreferences, AppSettings, RulesAndHelp, LogoutConfirmation } from './components/ProfileViews';
import { X } from 'lucide-react';
import { Type, GoogleGenAI } from "@google/genai";
import { callGeminiWithRetry } from './src/services/gemini';
import { teamStadiums } from './data/stadiums';
import { allFootballClubs } from './data/clubs';

import DirectMessageModal from './components/DirectMessageModal';
import PuskasPlayer from './components/PuskasPlayer';
import { getGoalVideos, clearGoalVideos } from './utils/videoService';
import { GoalVideo } from './types';

import { db, auth } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, where, getDocs, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';

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
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [history, setHistory] = useState<SavedTournament[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("History parse failed", e);
      return [];
    }
  });
  
  const [state, setState] = useState<TournamentState>({
    id: `tour-${Date.now()}`,
    teams: [],
    matches: [],
    mode: TournamentMode.SINGLE,
    type: TournamentType.CHAMPIONS_LEAGUE,
    managerName: 'Baş məşqçi',
    isStarted: false,
    isDrawing: false,
    teamPlayers: {},
    socialFeed: []
  });

  const [activeDM, setActiveDM] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [showPuskas, setShowPuskas] = useState(false);
  const [goalVideos, setGoalVideos] = useState<GoalVideo[]>([]);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showPressCoverage, setShowPressCoverage] = useState(false);
  const [activeStandingsView, setActiveStandingsView] = useState<'standings' | 'bracket'>('standings');
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [userTournaments, setUserTournaments] = useState<TournamentState[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [favoriteTeam, setFavoriteTeam] = useState<Team | null>(() => {
    try {
      const saved = localStorage.getItem('fav_team');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const selectedMatchData = useMemo(() => {
    if (!selectedMatchId) return null;
    
    // Check if it's a history ID format: tourId-matchId
    let matchId = selectedMatchId;
    let tourId: string | null = null;
    
    if (selectedMatchId.startsWith('tour-')) {
      const parts = selectedMatchId.split('-');
      // Parts: [tour, timestamp, match, ...]
      if (parts.length >= 3) {
        tourId = `${parts[0]}-${parts[1]}`;
        matchId = parts.slice(2).join('-');
      }
    }

    // Try current state first if no specific tourId or if tourId matches current
    if (!tourId || tourId === state.id) {
      const currentMatch = state.matches.find(m => m.id === matchId);
      if (currentMatch) {
        const homeTeam = state.teams.find(t => t.id === currentMatch.homeTeamId);
        const awayTeam = state.teams.find(t => t.id === currentMatch.awayTeamId);
        if (homeTeam && awayTeam) {
          return {
            match: currentMatch,
            allMatches: state.matches,
            homeTeam,
            awayTeam,
            teamPlayers: state.teamPlayers || {},
            tournamentId: state.id,
            canEdit: (!state.adminId || state.adminId === user?.uid || state.allowViewerEdit) && !state.isViewOnly
          };
        }
      }
    }

    // Search in history
    const targetTour = tourId ? userTournaments.find(t => t.id === tourId) : null;
    if (targetTour) {
      const match = targetTour.matches.find(m => m.id === matchId);
      if (match) {
        const homeTeam = targetTour.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = targetTour.teams.find(t => t.id === match.awayTeamId);
        if (homeTeam && awayTeam) {
          return {
            match,
            allMatches: targetTour.matches,
            homeTeam,
            awayTeam,
            teamPlayers: targetTour.teamPlayers || {},
            tournamentId: targetTour.id,
            canEdit: targetTour.adminId === user?.uid
          };
        }
      }
    } else if (!tourId) {
      // If no tourId specified, search all tournaments
      for (const tour of userTournaments) {
        const match = tour.matches.find(m => m.id === matchId);
        if (match) {
          const homeTeam = tour.teams.find(t => t.id === match.homeTeamId);
          const awayTeam = tour.teams.find(t => t.id === match.awayTeamId);
          if (homeTeam && awayTeam) {
            return {
              match,
              allMatches: tour.matches,
              homeTeam,
              awayTeam,
              teamPlayers: tour.teamPlayers || {},
              tournamentId: tour.id,
              canEdit: tour.adminId === user?.uid
            };
          }
        }
      }
    }
    
    return null;
  }, [selectedMatchId, state, userTournaments, user]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeProfileView, setActiveProfileView] = useState<ProfileView>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      // If logged in but no favorite team, force selection
      if (u && !favoriteTeam) {
        setActiveProfileView('preferences');
      }
    });
    return () => unsubscribe();
  }, [favoriteTeam]);

  // Fetch user tournaments
  useEffect(() => {
    if (!user) {
      setUserTournaments([]);
      return;
    }

    const q = query(collection(db, 'tournaments'), where('adminId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const tours = snapshot.docs.map(d => d.data().state as TournamentState);
      setUserTournaments(tours);
    });

    return () => unsub();
  }, [user]);

  const userMatchHistory = useMemo(() => {
    const history: any[] = [];
    userTournaments.forEach(tour => {
      tour.matches.filter(m => m.isFinished).forEach(m => {
        const homeTeam = tour.teams.find(t => t.id === m.homeTeamId);
        const awayTeam = tour.teams.find(t => t.id === m.awayTeamId);
        
        if (homeTeam && awayTeam) {
          let perspectiveTeam = homeTeam;
          let opponentTeam = awayTeam;
          let perspectiveScore = m.homeScore || 0;
          let opponentScore = m.awayScore || 0;

          if (favoriteTeam) {
            // Only show matches involving the favorite team if we want that perspective
            const isFavHome = homeTeam.id === favoriteTeam.id || homeTeam.name === favoriteTeam.name;
            const isFavAway = awayTeam.id === favoriteTeam.id || awayTeam.name === favoriteTeam.name;
            
            if (!isFavHome && !isFavAway) return;

            if (isFavAway) {
              perspectiveTeam = awayTeam;
              opponentTeam = homeTeam;
              perspectiveScore = m.awayScore || 0;
              opponentScore = m.homeScore || 0;
            }
          }

          history.push({
            id: `${tour.id}-${m.id}`,
            teamName: perspectiveTeam.name,
            opponentName: opponentTeam.name,
            score: perspectiveScore,
            opponentScore: opponentScore,
            result: perspectiveScore > opponentScore ? 'W' : perspectiveScore === opponentScore ? 'D' : 'L',
            date: parseInt(tour.id.split('-')[1]),
            originalMatch: m,
            tourTeams: tour.teams,
            tourMatches: tour.matches
          });
        }
      });
    });
    return history.sort((a, b) => b.date - a.date);
  }, [userTournaments, favoriteTeam]);

  const handleSaveFavoriteTeam = (team: Team) => {
    setFavoriteTeam(team);
    localStorage.setItem('fav_team', JSON.stringify(team));
    setActiveProfileView(null);
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Set custom parameters to force selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e: any) {
      console.error("Google Login failed", e);
      // Don't show alert for user cancellation or blocked popups
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        if (e.code === 'auth/popup-blocked') {
          alert("Lütfən, brauzerinizdə 'Pop-up' pəncərələrə icazə verin.");
        } else {
          alert(`Giriş xətası: ${e.message}`);
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Real-time listener for tournament state
  useEffect(() => {
    if (!state.isOnline || !state.id) return;

    const unsub = onSnapshot(doc(db, 'tournaments', state.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.adminId !== user?.uid) {
          setState(prev => ({
            ...prev,
            ...data.state,
            isOnline: true,
            roomPin: data.pin,
            adminId: data.adminId
          }));
        }
      }
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    return () => unsub();
  }, [state.id, state.isOnline, user?.uid]);

  // Save to Firebase if Admin
  const syncToFirebase = async (newState: TournamentState) => {
    if (!newState.isOnline || !newState.id || newState.adminId !== user?.uid) return;
    
    try {
      await updateDoc(doc(db, 'tournaments', newState.id), {
        state: newState,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase update failed", e);
    }
  };
  
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
  useEffect(() => { 
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); 
    } catch (e) {
      console.error("History save failed", e);
    }
  }, [history]);

  useEffect(() => {
    const handleSave = (e: any) => {
      if (e.detail && e.detail.name) {
        saveTournament(e.detail.name);
      }
    };
    window.addEventListener('save-tournament', handleSave);
    return () => window.removeEventListener('save-tournament', handleSave);
  }, [state]);

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

  const handleMatchStatsClose = () => {
    const currentMatch = state.matches.find(m => m.id === selectedMatchId);
    setSelectedMatchId(null);
    
    // Check if tournament just finished
    if (currentMatch && currentMatch.isFinished) {
      const allFinished = state.matches.every(m => m.id === currentMatch.id ? true : m.isFinished);
      if (allFinished) {
        setShowWinner(true);
      }
    }
  };

  useEffect(() => { 
    // Remove the automatic timer-based winner show to favor the explicit close trigger
    // but keep it as a fallback for other modes if needed.
    if (isFinished && !showWinner) {
      // const timer = setTimeout(() => setShowWinner(true), 1500);
      // return () => clearTimeout(timer);
    }
  }, [isFinished, showWinner]);

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
        // Close match overlay only when interview is ready
        setSelectedMatchId(null);
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

  const startTournament = async (teams: Team[], mode: TournamentMode, type: TournamentType, managerName: string, allowViewerEdit: boolean = false) => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const newId = `tour-${Date.now()}`;
    
    const enrichedTeams = teams.map(t => ({
      ...t,
      country: getTeamCountry(t.name)
    }));

    if (!user) {
      await handleGoogleLogin();
      return;
    }

    const newState: TournamentState = {
      id: newId,
      teams: enrichedTeams,
      matches: [],
      mode,
      type,
      managerName,
      isStarted: true,
      isDrawing: true,
      teamPlayers: {},
      socialFeed: [],
      roomPin: pin,
      adminId: user.uid,
      isOnline: true,
      allowViewerEdit,
      participants: [{
        uid: user.uid,
        name: user.displayName || 'Manager',
        avatar: user.photoURL || '',
        teamId: favoriteTeam?.id || null,
        teamName: favoriteTeam?.name || null
      }]
    };

    try {
      setViewingMenu(false);
      setState(newState);
      await setDoc(doc(db, 'tournaments', newId), {
        id: newId,
        pin,
        adminId: user?.uid,
        state: newState,
        createdAt: serverTimestamp()
      });
      playAnthem();
    } catch (e) {
      console.error("Tournament creation failed", e);
      alert("Turnir yaradıla bilmədi. İnternet bağlantısını yoxlayın.");
    }
  };

  const joinTournament = async (pin: string) => {
    try {
      const q = query(collection(db, 'tournaments'), where('pin', '==', pin));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Səhv PIN! Belə bir turnir tapılmadı.");
        return;
      }

      const tourDoc = querySnapshot.docs[0];
      const data = tourDoc.data();
      const tourState = data.state as TournamentState;
      
      // Update participants list
      if (user) {
        const participants = [...(tourState.participants || [])];
        if (!participants.some(p => p.uid === user.uid)) {
          participants.push({
            uid: user.uid,
            name: user.displayName || 'Viewer',
            avatar: user.photoURL || '',
            teamId: favoriteTeam?.id || null,
            teamName: favoriteTeam?.name || null
          });
          
          await updateDoc(doc(db, 'tournaments', tourDoc.id), {
            'state.participants': participants
          });
        }
      }

      setViewingMenu(false);
      setState({
        ...tourState,
        id: tourDoc.id,
        isOnline: true,
        roomPin: data.pin,
        adminId: data.adminId
      });
      playAnthem();
    } catch (e) {
      console.error("Join failed", e);
      alert("Qoşulma xətası.");
    }
  };

  const goToDraw = (teams: Team[], mode: TournamentMode, type: TournamentType, managerName: string, allowViewerEdit: boolean) => {
    startTournament(teams, mode, type, managerName, allowViewerEdit);
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
          toxicityLevel: 0,
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
      const finishedMatches = state.matches.filter(m => m.isFinished);
      const matchContext = finishedMatches.map(m => {
        const h = state.teams.find(t => t.id === m.homeTeamId)?.name;
        const a = state.teams.find(t => t.id === m.awayTeamId)?.name;
        return `${h} ${m.homeScore}-${m.awayScore} ${a} (Qollar: ${[...(m.homeScorers || []), ...(m.awayScorers || [])].join(', ')}, Asistlər: ${[...(m.homeAssists || []), ...(m.awayAssists || [])].join(', ')}, MVP: ${m.mvp})`;
      }).join('\n');

      const prompt = `Sən İnstagramda "${conversation.author}" (@${handle}) adlı futbol azarkeşisən. 
      İstifadəçi sənə bu mesajı yazdı: "${text}".
      
      Sənin xarakterin: İlk öncə istifadəçi ilə qısa bir tanışlıq söhbəti olsun (məsələn: "Salam, necəsən?", "Tanış olduğumuza şadam"), amma çox uzatmadan tez bir zamanda futbol mövzusuna və ya başqa maraqlı sahələrə keçid al. Səmimi və mehriban ol.
      
      Turnir haqqında məlumatlar (əgər istifadəçi soruşsa):
      ${matchContext}
      
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
        let newToxicityLevel = Math.min(100, newToxicityCount * 35);
        let shouldBlock = data.reply.includes("BLOK") || newToxicityCount >= 3;
        if (shouldBlock) newToxicityLevel = 100;

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
          toxicityLevel: newToxicityLevel,
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
      const currentToxicityCount = dmConversations[handle].toxicityCount || 0;
      const newToxicityCount = shouldBlock ? 3 : currentToxicityCount + (callCount > 3 ? 1 : 0);
      const newToxicityLevel = Math.min(100, newToxicityCount * 35 + (callCount * 10));

      dmConversations[handle] = {
        ...dmConversations[handle],
        messages: [...dmConversations[handle].messages, aiMsg],
        callCount: callCount,
        lastCallTime: now,
        toxicityCount: newToxicityCount,
        toxicityLevel: Math.min(100, newToxicityLevel),
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
    const newState = { 
      ...state, 
      teams: shuffledTeams, 
      matches: fixtures, 
      isDrawing: false, 
      isStarted: true 
    };
    setState(newState);
    if (state.isOnline) syncToFirebase(newState);
    
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
      
      const isBigGame = match.stageName === 'Final' || match.stageName === 'Yarımfinal' || match.stageName === '1/4 Final' || match.isKnockout;
      const baseLikes = isBigGame ? Math.floor(Math.random() * 500000) + 500000 : Math.floor(Math.random() * 50000) + 10000;

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
        likes: baseLikes,
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
    if (state.isOnline && state.adminId !== user?.uid) {
      alert("Yalnız Admin xalları daxil edə bilər!");
      return;
    }
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

    // Sync to Firebase if online
    setState(prev => {
      if (prev.isOnline) syncToFirebase(prev);
      return prev;
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

  const saveTournament = async (name: string) => {
    if (!name.trim()) return;
    try {
      const st = calculateStandings(state.teams, state.matches);
      
      // Create a clean copy of the state to save
      const stateToSave = JSON.parse(JSON.stringify(state));
      stateToSave.managerName = name.trim(); // Update name
      
      const newRecord: SavedTournament = { 
        id: Date.now().toString(), 
        name: name.trim(), 
        date: new Date().toLocaleString('az-AZ'), 
        standings: st, 
        matches: stateToSave.matches, 
        type: state.type,
        state: stateToSave
      };

      setHistory(prev => [newRecord, ...prev]);

      // If logged in, save to Firestore
      if (user) {
        const tourData = {
          id: state.id,
          adminId: user.uid,
          state: {
            ...stateToSave,
            managerName: name.trim()
          },
          createdAt: serverTimestamp(),
          pin: state.roomPin || Math.floor(100000 + Math.random() * 900000).toString()
        };
        
        await setDoc(doc(db, 'tournaments', state.id), tourData, { merge: true });
      }

      setSaveStatus({ type: 'success', message: 'Turnir tarixçəyə əlavə edildi!' });
      setTimeout(() => setSaveStatus(null), 3000);
      setShowSaveModal(false);
      setSaveName('');
      
      // Update local state name too
      setState(prev => ({ ...prev, managerName: name.trim() }));
    } catch (error) {
      console.error("Save tournament error:", error);
      setSaveStatus({ type: 'error', message: 'Xəta baş verdi. Yenidən yoxlayın.' });
    }
  };

  const resumeTournament = (saved: SavedTournament) => {
    setState({
      ...saved.state,
      isOnline: false
    });
    setViewingMenu(false);
    setShowHistory(false);
    alert(`${saved.name} turniri bərpa olundu!`);
  };

  const getOverallMVP = (): string => {
    const mvps = state.matches.map(m => m.mvp).filter(Boolean) as string[];
    if (mvps.length === 0) return "Müəyyən edilməyib";
    const counts: Record<string, number> = {};
    mvps.forEach(m => counts[m] = (counts[m] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const resetTournament = () => {
    setState({
      id: `tour-${Date.now()}`,
      teams: [],
      matches: [],
      mode: TournamentMode.SINGLE,
      type: TournamentType.CHAMPIONS_LEAGUE,
      managerName: 'Baş məşqçi',
      isStarted: false,
      isDrawing: false,
      teamPlayers: {},
      socialFeed: []
    });
    setViewingMenu(true);
    setShowWinner(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveAndResetTournament = (name: string) => {
    saveTournament(name);
    resetTournament();
  };

  const st = useMemo(() => calculateStandings(state.teams, state.matches), [state.teams, state.matches, resetKey]);
  const groupedSt = useMemo(() => {
    if (state.mode === TournamentMode.GROUP_KNOCKOUT || state.mode === TournamentMode.LEAGUE_KNOCKOUT) {
      return calculateGroupedStandings(state.teams, state.matches);
    }
    return undefined;
  }, [state.teams, state.matches, state.mode, resetKey]);
  const showSetup = viewingMenu || (!state.isStarted && !state.isDrawing);

  if (!isAuthReady) return null;

  // Forced Login Screen (Nocturnal Arena Theme)
  if (!user && !isGuest) {
    return (
      <div className="bg-surface font-body text-on-surface overflow-hidden min-h-screen relative flex flex-col items-center justify-center px-6">
        {/* Background Environment */}
        <div className="fixed inset-0 stadium-glow z-0">
          {/* Subtle Glow Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-fixed/5 blur-[120px]"></div>
          {/* Subtle Particles Layout */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 particle"></div>
          <div className="absolute top-3/4 left-1/3 w-2 h-2 particle"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 particle"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1 h-1 particle"></div>
        </div>

        {/* Main Content Canvas */}
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          {/* Brand Identity Section */}
          <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-10 duration-1000">
            <div className="relative mb-6">
              {/* Glowing Logo Backdrop */}
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform scale-150"></div>
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-primary drop-shadow-[0_0_30px_rgba(177,198,252,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
              </div>
            </div>
            <h1 className="font-headline font-black text-4xl md:text-6xl tracking-tighter text-center text-primary-fixed-dim uppercase drop-shadow-2xl">Futbol<span className="text-secondary-fixed drop-shadow-[0_0_15px_rgba(97,255,151,0.6)] font-black">Pro</span></h1>
            <p className="font-headline text-on-surface-variant font-medium tracking-[0.2em] text-xs md:text-sm mt-2">GECƏ ARENASI</p>
          </div>

          {/* Premium Login Container */}
          <div className="login-glass-card w-full max-w-md rounded-[40px] p-10 flex flex-col items-center gap-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_20px_50px_-10px_rgba(0,0,0,0.8)] animate-in zoom-in duration-700">
            <div className="w-full space-y-4">
              {/* Google Login Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-100 transition-all duration-300 py-4 px-6 rounded-full active:scale-[0.98] group shadow-xl disabled:opacity-70"
              >
                {isLoggingIn ? (
                  <div className="w-6 h-6 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                ) : (
                  <img alt="Google Icon" className="w-6 h-6" src="https://lh3.googleusercontent.com/COxitqgJr1sICpeqCuQE0m2WF6LQU97S0898p-8fS4Wv7U8UvQ99v6Gu0E-x8m73yS8T9w=s120"/>
                )}
                <span className="text-[#1f1f1f] font-headline font-bold text-lg">
                  {isLoggingIn ? 'Giriş edilir...' : 'Google ilə giriş et'}
                </span>
              </button>
              {/* Guest Login Button */}
              <button 
                onClick={() => setIsGuest(true)}
                className="w-full flex items-center justify-center gap-4 bg-surface-container-highest/40 hover:bg-surface-container-highest/60 neon-border transition-all duration-300 py-4 px-6 rounded-full active:scale-[0.98] group shadow-xl"
              >
                <span className="material-symbols-outlined text-secondary-fixed group-hover:scale-110 transition-transform">person_outline</span>
                <span className="text-secondary font-headline font-semibold text-lg tracking-wide">Qonaq kimi davam et</span>
              </button>
            </div>

            {/* Divider (Minimal Editorial Style) */}
            <div className="flex items-center w-full gap-4">
              <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">və ya</span>
              <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>
            </div>

            {/* Subtle Registration Link */}
            <div className="text-center">
              <p className="text-on-surface-variant text-sm font-medium">
                Hələ də üzv deyilsiniz? <a className="text-primary hover:text-primary-fixed-dim font-bold transition-colors" href="#">Qeydiyyat</a>
              </p>
            </div>
          </div>

          {/* Footer Identity */}
          <footer className="mt-16 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.4em] text-secondary-fixed/60 font-bold">
              Polad tərəfindən hazırlandı
            </p>
          </footer>
        </main>

        {/* Visual Decoration (Asymmetrical Balance) */}
        <div className="fixed top-0 right-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <img 
            aria-hidden="true" 
            className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] object-cover opacity-10 mix-blend-screen" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmp5Im_PEdEOMTmsxdY3uOFEYVS4bI7E-4fAJBDEKdR1p0EPspNHuwJUaaePPh13PXrUda6S883wYdoHSolN77E2c7v-xoQ6MohaBUeuJkK57kilXsH_yI_62lMpXx-4n9_6v5HLHATSmyO2x37yaDf81Xe4PO8W8LwGLPB_9w_GjP-whUbikQat0yb5f-kHCPV-9F7etn0yp--PpnJQtKuhattdieTR8oOhcr8v2ZZa7osDYCR2KOwwEGb65xLA9vrnSaRObeXXo"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col ucl-bg-pattern font-display selection:bg-[#39FF14] selection:text-[#010412] transition-all duration-300 scale-[0.98] md:scale-100 origin-top">
      {state.isStarted && !showSetup && !state.isDrawing && !(state.type === TournamentType.CHAMPIONS_LEAGUE && state.mode === TournamentMode.KNOCKOUT && !state.isDrawing) && (
        <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <span className="material-symbols-outlined text-[#020617] font-bold text-2xl md:text-3xl">sports_soccer</span>
              </div>
              <div className="font-display text-xl md:text-2xl font-black tracking-tighter italic text-white">
                FUTBOL <span className="text-neon drop-shadow-[0_0_10px_#39FF14]">PRO</span>
              </div>
            </div>

            {/* Room PIN Box */}
            {state.isOnline && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-center bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 shadow-inner">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">ROOM PIN</span>
                  <span className="text-xl font-black text-neon tracking-widest drop-shadow-[0_0_8px_#39FF14]">{state.roomPin}</span>
                </div>
                
                {/* Neon Live Participants Button */}
                <button 
                  onClick={() => setShowParticipantsModal(true)}
                  className="flex items-center gap-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl px-3 py-2 hover:bg-[#39FF14]/20 transition-all group"
                >
                  <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]"></div>
                  <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest drop-shadow-[0_0_5px_#39FF14]">
                    canlı {state.participants?.length || 1}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Icons Group */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5">
              <button 
                onClick={toggleMute} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-white/40 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-xl">{isMuted ? 'volume_off' : 'volume_up'}</span>
              </button>
              <button 
                onClick={() => setShowStatsDashboard(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-xl">bar_chart</span>
              </button>
              <button 
                onClick={() => setShowSocialFeed(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </button>
            </div>

            {/* Buttons Group */}
            <div className="flex items-center gap-2">
              {user && (
                <div className="relative mr-2">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-10 h-10 rounded-full border-2 border-neon-green/30 overflow-hidden hover:border-neon-green transition-all"
                  >
                    <img src={user.photoURL || ""} className="w-full h-full object-cover" alt="" />
                  </button>
                  {showProfileDropdown && (
                    <UserProfileDropdown 
                      user={user} 
                      onLogout={() => auth.signOut()} 
                      onClose={() => setShowProfileDropdown(false)} 
                      onSelectView={setActiveProfileView}
                    />
                  )}
                </div>
              )}
              <button 
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/20 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">YADDA SAXLA</span>
              </button>
              <button 
                onClick={() => setViewingMenu(true)}
                className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl border border-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-sm">menu</span>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">MENYU</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {activeProfileView === 'tournaments' && (
        <MyTournaments 
          tournaments={userTournaments} 
          onSelectTournament={(id) => {
            const tour = userTournaments.find(t => t.id === id);
            if (tour) {
              setState({ ...tour, isViewOnly: true });
              setViewingMenu(false);
              setActiveProfileView(null);
            }
          }}
          onClose={() => setActiveProfileView(null)}
        />
      )}

      {activeProfileView === 'stats' && (
        <MatchHistory 
          matches={userMatchHistory} 
          onClose={() => setActiveProfileView(null)} 
          favoriteTeam={favoriteTeam}
          onMatchClick={(m) => {
            setSelectedMatchId(m.id);
          }}
        />
      )}

      {activeProfileView === 'preferences' && (
        <TeamPreferences 
          initialTeam={favoriteTeam}
          onSave={handleSaveFavoriteTeam}
          onClose={() => setActiveProfileView(null)}
          isMandatory={!favoriteTeam && !!user}
        />
      )}

      {activeProfileView === 'settings' && (
        <AppSettings 
          onClose={() => setActiveProfileView(null)}
        />
      )}

      {activeProfileView === 'help' && (
        <RulesAndHelp 
          onClose={() => setActiveProfileView(null)}
        />
      )}

      {activeProfileView === 'logout' && (
        <LogoutConfirmation 
          onConfirm={() => {
            auth.signOut();
            setIsGuest(false);
            setActiveProfileView(null);
          }}
          onCancel={() => setActiveProfileView(null)}
        />
      )}

      {showStatsDashboard && (
        <StatsDashboard 
          onClose={() => setShowStatsDashboard(false)} 
          teams={state.teams} 
          matches={state.matches} 
        />
      )}

      {showParticipantsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowParticipantsModal(false)}></div>
          <div className="relative w-full max-w-md elite-glass-card rounded-[2.5rem] p-8 md:p-10 border border-[#39FF14]/20 bg-[#010617] shadow-[0_0_80px_rgba(57,255,20,0.1)] overflow-hidden animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#39FF14]/10 rounded-2xl flex items-center justify-center border border-[#39FF14]/20">
                  <span className="material-symbols-outlined text-[#39FF14] text-3xl">hub</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">TURNİR ŞƏBƏKƏSİ</h3>
                  <p className="text-[10px] text-[#39FF14] font-black uppercase tracking-widest opacity-60">Canlı qoşulmalar</p>
                </div>
              </div>
              <button onClick={() => setShowParticipantsModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors border border-white/5">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {(state.participants || []).length > 0 ? (state.participants || []).map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-neon opacity-20 rounded-full blur group-hover:opacity-40 transition-opacity"></div>
                      <img src={participant.avatar} className="relative w-12 h-12 rounded-full border-2 border-neon object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm uppercase italic tracking-tight">{participant.name}</h4>
                      {participant.teamName && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-black text-neon uppercase tracking-widest">{participant.teamName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {participant.uid === state.adminId && (
                    <div className="px-3 py-1 bg-neon/10 border border-neon/30 rounded-full">
                      <span className="text-[7px] font-black text-neon uppercase tracking-widest">ADMIN</span>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 opacity-40">
                  <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Heç kim yoxdur</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center">
              <div className="px-4 py-2 bg-neon/5 border border-neon/10 rounded-xl">
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                   Oyunçu Kodu: <span className="text-neon tracking-widest">{state.roomPin}</span>
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMatchData && (
        <MatchStatsOverlay 
          match={selectedMatchData.match} 
          allMatches={selectedMatchData.allMatches}
          homeTeam={selectedMatchData.homeTeam}
          awayTeam={selectedMatchData.awayTeam}
          teamPlayers={selectedMatchData.teamPlayers}
          tournamentId={selectedMatchData.tournamentId}
          onUpdateScore={updateMatchScore}
          onStartInterview={generateInterview}
          onClose={handleMatchStatsClose} 
          canEdit={selectedMatchData.canEdit}
        />
      )}

      {state.type === TournamentType.CHAMPIONS_LEAGUE && (state.mode === TournamentMode.KNOCKOUT || state.mode === TournamentMode.LEAGUE_KNOCKOUT || state.mode === TournamentMode.LEAGUE) && !showSetup && !state.isDrawing ? (
        <UclKnockoutView 
          state={state} 
          onMatchClick={setSelectedMatchId} 
          onOpenStats={() => setShowStatsDashboard(true)} 
          onOpenSocial={() => setShowSocialFeed(true)} 
          onOpenMenu={() => setViewingMenu(true)} 
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      ) : (
        <main className="flex-grow container mx-auto px-1 md:px-6 py-2 md:py-10 relative z-10">
          {showSetup ? (
            <TournamentSetup 
              onStart={goToDraw} 
              onJoin={joinTournament}
              initialTeams={state.teams} 
              initialType={state.type}
              initialMode={state.mode}
              history={history} 
              hasExistingTournament={state.isStarted} 
              onResume={() => setViewingMenu(false)} 
              isMuted={isMuted} 
              onToggleMute={toggleMute} 
              onOpenSocialFeed={() => setShowSocialFeed(true)}
              user={user}
              onLogin={handleGoogleLogin}
              isLoggingIn={isLoggingIn}
              favoriteTeam={favoriteTeam}
              onSelectProfileView={setActiveProfileView}
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
                onOpenSocialFeed={() => setShowSocialFeed(true)}
              />
            )
          ) : (
            <div key={resetKey} className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 animate-in fade-in duration-700">
            {activeStandingsView === 'standings' && (
              <section className="lg:col-span-5 flex flex-col gap-4 md:gap-6 order-2 lg:order-1 animate-in slide-in-from-left duration-500">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 md:h-8 bg-neon rounded-full shadow-neon"></div>
                   <h2 className="font-display text-xl md:text-3xl font-black uppercase tracking-widest text-white italic">EŞLEŞMELER</h2>
                 </div>
                 <Fixtures 
                    matches={state.matches} 
                    teams={state.teams} 
                    teamPlayers={state.teamPlayers} 
                    onUpdateScore={updateMatchScore} 
                    onStartInterview={generateInterview}
                    type={state.type}
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
                <div className="premium-glass-card rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden bg-[#050e1c] border border-white/10">
                   <div className="flex items-center justify-between mb-6 md:mb-10">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 md:h-8 bg-neon rounded-full shadow-neon"></div>
                        <h2 className="font-display text-xl md:text-3xl font-black uppercase tracking-widest text-white italic">PLEY-OFF AĞACI</h2>
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
                     <Standings standings={st} groupedStandings={groupedSt} onSave={saveTournament} isFinished={isFinished} isViewOnly={state.isViewOnly} />
                   ) : (
                     <div className="premium-glass-card rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden bg-[#050e1c] border border-white/10 animate-in fade-in zoom-in duration-500">
                       <div className="flex items-center justify-between mb-6 md:mb-10">
                         <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-neon animate-pulse"></div>
                            <h2 className="font-display text-xl md:text-3xl font-black uppercase tracking-widest text-white italic">PLEY-OFF AĞACI</h2>
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
                         LİQA MƏRHƏLƏSİ
                       </button>
                       <button 
                         onClick={() => setActiveStandingsView('bracket')}
                         className={`flex-1 md:flex-none md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all duration-300 ${activeStandingsView === 'bracket' ? 'bg-neon text-[#010412] shadow-[0_0_20px_rgba(57,255,20,0.4)]' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}
                       >
                         PLEY-OFF
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

      {!(state.type === TournamentType.CHAMPIONS_LEAGUE && state.mode === TournamentMode.KNOCKOUT && !showSetup && !state.isDrawing) && !showSetup && (
        <footer className="mt-auto p-6 md:p-8 border-t border-white/5 glass-panel-white text-center">
          <p className="font-mono text-[10px] md:text-[11px] tracking-[0.5em] text-white/30 uppercase font-bold">
             Hazırladı <span className="text-neon">Polad</span>
          </p>
        </footer>
      )}
      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)}></div>
          <div className="relative w-full max-w-md premium-glass-card rounded-3xl p-8 border border-white/10 bg-[#050e1c] shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-white uppercase italic mb-6 tracking-tight">Turniri Yadda Saxla</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Turnir Adı</label>
                <input 
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Məs: Çempionlar Liqası 2024"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-bold"
                  onKeyDown={(e) => e.key === 'Enter' && saveName.trim() && saveTournament(saveName)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => saveName.trim() && saveTournament(saveName)}
                  disabled={!saveName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all uppercase text-xs tracking-widest"
                >
                  YADDA SAXLA
                </button>
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black py-3 rounded-xl transition-all uppercase text-xs tracking-widest"
                >
                  LƏĞV ET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveStatus && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-bottom-10 duration-500 ${
          saveStatus.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {saveStatus.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {saveStatus.message}
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar premium-glass-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[#050e1c]">
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">TURNİR TARİXÇƏSİ</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 md:gap-6">
              {history.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <span className="material-symbols-outlined text-6xl mb-4">history</span>
                  <p className="text-xl font-bold uppercase tracking-widest">Hələ ki yadda saxlanılmış turnir yoxdur</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 hover:bg-white/[0.08] transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-500/20">
                            {item.type === TournamentType.CHAMPIONS_LEAGUE ? 'UCL' : 'DÜNYA KUBOKU'}
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-white/30">{item.date}</span>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-4">{item.name}</h3>
                        
                        <div className="flex flex-wrap gap-4 md:gap-8">
                          <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">KOMANDALAR</span>
                            <span className="text-sm md:text-lg font-bold text-white">{item.standings.length}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">OYUNLAR</span>
                            <span className="text-sm md:text-lg font-bold text-white">{item.matches.length}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">STATUS</span>
                            <span className={`text-sm md:text-lg font-bold ${item.matches.every(m => m.isFinished) ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {item.matches.every(m => m.isFinished) ? 'BİTİB' : 'DAVAM EDİR'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => resumeTournament(item)}
                          className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-neon text-[#010412] font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-transform"
                        >
                          DAVAM ET
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Bu turniri silmək istədiyinizə əminsiniz?')) {
                              setHistory(prev => prev.filter(h => h.id !== item.id));
                            }
                          }}
                          className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {showWinner && getTournamentWinner() && (
        <WinnerOverlay 
          winner={getTournamentWinner()!} 
          mvp={getOverallMVP()}
          onClose={() => setShowWinner(false)} 
          onReset={(name) => {
            if (name) saveAndResetTournament(name as string);
            else resetTournament();
          }}
          onPlayPuskas={async () => {
            const allVideos = await getGoalVideos();
            console.log("All saved videos:", allVideos.map(v => ({ id: v.id, tourId: v.tournamentId })));
            console.log("Current tournament ID:", state.id);
            
            let filteredVideos = allVideos.filter(v => v.tournamentId === state.id);
            
            // Fallback: if no videos found for current ID, but there are videos with 'default'
            // this helps if tournamentId was somehow lost or not passed
            if (filteredVideos.length === 0) {
              filteredVideos = allVideos.filter(v => v.tournamentId === 'default');
            }
            
            setGoalVideos(filteredVideos);
            setShowPuskas(true);
          }}
        />
      )}
      
      {showPuskas && (
        <PuskasPlayer 
          videos={goalVideos} 
          onClose={() => setShowPuskas(false)} 
        />
      )}
      {showSocialFeed && (
        <SocialFeedModal 
          onClose={() => setShowSocialFeed(false)} 
          posts={state.socialFeed || []} 
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
      {/* App Wide Footer */}
      {!showSetup && !state.isDrawing && (
        <div className="fixed bottom-4 left-0 w-full text-center z-50 pointer-events-none opacity-40">
           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Polad tərəfindən hazırlandı</p>
        </div>
      )}
    </div>
  );
};

export default App;
