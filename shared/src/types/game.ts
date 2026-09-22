import { Faction, NightAbilityKind, Role } from './role.js';
import { Player, PlayerPublic } from './player.js';

export enum GameStatus {
  notStarted = 'notStarted',
  inLobby = 'inLobby',
  inRoleReveal = 'inRoleReveal',
  inMatchIntro = 'inMatchIntro',
  inNight = 'inNight',
  inMorning = 'inMorning',
  inDiscussion = 'inDiscussion',
  inVoting = 'inVoting',
  inDayPowers = 'inDayPowers',
  inElimination = 'inElimination',
  inGameOver = 'inGameOver',
}

export enum EventType {
  darkFog = 'darkFog',
  peacefulNight = 'peacefulNight',
  royalDecree = 'royalDecree',
  bloodMoon = 'bloodMoon',
  truthSpell = 'truthSpell',
}

export interface MatchSettings {
  revealEliminatedRole: boolean;
  kingMustSurvive: boolean;
  enableNarrator: boolean;
  enableMusic: boolean;
  enableSfx: boolean;
  discussionTimerSeconds: number;
  votingTimerSeconds: number;
  enableAbilityTimer: boolean;
  abilityTimerSeconds: number;
  eventsEnabled: boolean;
  enabledEvents: EventType[];
  randomEvents: boolean;
  maxEventsPerMatch: number;
  enabledCoreRoles: string[];
  enableScoring: boolean;
  includeNeutrals: boolean;
  enabledRoleIds: string[];
}

export interface GameEvent {
  id: string;
  type: EventType;
  description: string;
  applied?: boolean;
}

export interface NightAction {
  playerId: string;
  targetIds: string[];
  copiedRoleId?: string; // Used by Impersonator
}

export interface Vote {
  voterId: string;
  targetId: string; // Empty string or 'skip' if abstained
}

export enum VictoryKind {
  undecided = 'undecided',
  faction = 'faction',
  solo = 'solo',
}

export interface VictoryOutcome {
  kind: VictoryKind;
  faction?: Faction;
  winnerIds?: string[];
  ruleId?: string;
  reason?: string;
}

export interface PrivateIntel {
  playerId: string;
  playerName: string;
  roleId: string;
  roleName: string;
  roleIcon: string;
  title: string;
  body: string;
  targetNames: string[];
  revealedFaction?: Faction;
  resultLabel?: string;
  success?: boolean;
}

export interface TimelineEvent {
  id: string;
  night: number;
  phase: string;
  actorName?: string;
  targetNames?: string[];
  title: string;
  description: string;
  isHighlight?: boolean;
}

export interface AbilityResult {
  success: boolean;
  message: string;
  affectedPlayers?: string[];
}

export interface PublicGameState {
  matchId: string;
  roomCode: string;
  status: GameStatus;
  currentNight: number;
  dayNumber: number;
  phaseEndsAt?: number;
  players: PlayerPublic[];
  aliveCount: number;
  eliminatedPlayer?: PlayerPublic;
  narration?: string;
  activeEvents: GameEvent[];
  runoffPending: boolean;
  runoffCandidates: PlayerPublic[];
  currentVoterId?: string;
  victory: VictoryOutcome;
  gameTimeline: TimelineEvent[];
}

export interface PrivatePlayerState {
  playerId: string;
  role?: Role;
  faction?: Faction;
  allies?: { id: string; name: string; roleName?: string }[];
  owedIntel: PrivateIntel[];
  canActTonight: boolean;
  nightCooldownRemaining: number;
  dayCooldownRemaining: number;
  hasUsedBonusAttack?: boolean;
  shadowRecommendation?: string;
}
