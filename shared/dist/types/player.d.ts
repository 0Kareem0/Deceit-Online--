import { Faction, Role } from './role.js';
export declare enum Gender {
    male = "male",
    female = "female"
}
export declare enum EliminationCause {
    none = "none",
    votedOut = "votedOut",
    killed = "killed",
    poisoned = "poisoned",
    sacrificed = "sacrificed"
}
export declare enum HistoryResultType {
    none = "none",
    faction = "faction",
    comparison = "comparison",
    surveillance = "surveillance"
}
export interface AbilityHistoryEntry {
    roleId: string;
    roleName: string;
    roleIcon: string;
    night: number;
    success: boolean;
    targetNames: string[];
    resultType: HistoryResultType;
    faction?: Faction;
    sameTeam?: boolean;
    visitorNames?: string[];
    body: string;
}
export interface Player {
    id: string;
    name: string;
    gender: Gender;
    isHost: boolean;
    isReady: boolean;
    isOnline: boolean;
    isAlive: boolean;
    isBot?: boolean;
    role?: Role;
    eliminationCause: EliminationCause;
    poisonedCount: number;
    isSilenced: boolean;
    isAbilityBlocked: boolean;
    nightCooldownEnd: number;
    dayCooldownEnd: number;
    abilityUsesCount: number;
    successfulAbilityUsesCount: number;
    hasUsedBonusAttack: boolean;
    lastTargetId?: string;
    hasAchievedPrivateGoal: boolean;
    abilityHistory: AbilityHistoryEntry[];
}
export interface PlayerPublic {
    id: string;
    name: string;
    gender: Gender;
    isHost: boolean;
    isReady: boolean;
    isOnline: boolean;
    isAlive: boolean;
    isBot?: boolean;
    eliminationCause?: EliminationCause;
    roleRevealed?: Role;
    isSilenced?: boolean;
}
