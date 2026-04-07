
export interface Team {
  id: string;
  name: string;
  logo: string;
  country?: string;
}

export interface MatchStats {
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  onTargetHome: number;
  onTargetAway: number;
  savesHome: number;
  savesAway: number;
  cornersHome: number;
  cornersAway: number;
  offsidesHome: number;
  offsidesAway: number;
  passesHome: number;
  passesAway: number;
  foulsHome: number;
  foulsAway: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScorers?: string[];
  awayScorers?: string[];
  homeAssists?: string[];
  awayAssists?: string[];
  homeYellowCards?: string[];
  awayYellowCards?: string[];
  homeRedCards?: string[];
  awayRedCards?: string[];
  mvp?: string;
  aiNews?: string;
  isFinished: boolean;
  round: number;
  stats?: MatchStats;
  isKnockout?: boolean;
  isSecondLeg?: boolean;
  firstLegMatchId?: string;
  penaltyWinnerId?: string;
  nextMatchId?: string;
  nextMatchSlot?: 'home' | 'away';
  stageName?: string; // e.g. "1/8 Final", "1/4 Final", "Yarımfinal", "Final"
}

export enum TournamentMode {
  SINGLE = 'SINGLE',
  HOME_AWAY = 'HOME_AWAY',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
  KNOCKOUT = 'KNOCKOUT',
  LEAGUE_KNOCKOUT = 'LEAGUE_KNOCKOUT',
  LEAGUE = 'LEAGUE'
}

export enum TournamentType {
  CHAMPIONS_LEAGUE = 'CHAMPIONS_LEAGUE',
  WORLD_CUP = 'WORLD_CUP'
}

export interface Standing {
  teamId: string;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: ('Q' | 'H' | 'M')[];
}

export interface SavedTournament {
  id: string;
  name: string;
  date: string;
  standings: Standing[];
  matches: Match[];
  type: TournamentType;
}

export interface SocialComment {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  likes: string;
}

export interface SocialPost {
  id: string;
  matchTitle: string;
  matchScore: string;
  matchDetails: string;
  homeLogo?: string;
  awayLogo?: string;
  stadium?: string;
  country?: string;
  comments: SocialComment[];
  timestamp: string;
}

export interface DirectMessage {
  id: string;
  senderId: string; // 'user' or commenter handle
  text: string;
  timestamp: string;
}

export interface DMConversation {
  handle: string;
  author: string;
  avatar: string;
  messages: DirectMessage[];
  isBlocked: boolean;
  toxicityCount: number;
  relationshipLevel: number; // 0-100
  callCount?: number;
  lastCallTime?: number;
}

export interface TournamentState {
  teams: Team[];
  matches: Match[];
  mode: TournamentMode;
  type: TournamentType;
  managerName: string;
  isStarted: boolean;
  isDrawing: boolean;
  teamPlayers: Record<string, string[]>;
  socialFeed?: SocialPost[];
  dmConversations?: Record<string, DMConversation>;
}

export interface InterviewOption {
  text: string;
  type: 'PROFESSIONAL' | 'TROLL';
  reaction: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  options: InterviewOption[];
}

export interface InterviewData {
  matchId: string;
  questions: InterviewQuestion[];
  intervieweeName: string;
  intervieweeTeamLogo: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeScorers: string[];
  awayScorers: string[];
  mvp: string;
  stadiumName?: string;
  teamCountry?: string;
}
