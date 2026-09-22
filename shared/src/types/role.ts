export enum Faction {
  kingdom = 'kingdom',
  shadow = 'shadow',
  neutral = 'neutral',
}

export enum RoleType {
  special = 'special',
  support = 'support',
  attack = 'attack',
  neutral = 'neutral',
}

export enum Difficulty {
  easy = 'easy',
  medium = 'medium',
  hard = 'hard',
}

export enum NightAbilityKind {
  none = 'none',
  block = 'block',
  mark = 'mark',
  protect = 'protect',
  heal = 'heal',
  frame = 'frame',
  copy = 'copy',
  attack = 'attack',
  poison = 'poison',
  sacrifice = 'sacrifice',
  silence = 'silence',
  investigate = 'investigate',
  compare = 'compare',
  watch = 'watch',
}

export enum DayAbilityKind {
  none = 'none',
  veto = 'veto',
}

export enum ResultTiming {
  none = 'none',
  instant = 'instant',
  nextTurn = 'nextTurn',
}

export interface CooldownBracket {
  maxPlayers: number;
  cooldownDays: number;
}

export interface Role {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  cardImage?: string;
  faction: Faction;
  roleType: RoleType;
  difficulty: Difficulty;
  description: string;
  descriptionEn: string;
  lore: string;
  loreEn: string;
  goal: string;
  goalEn: string;
  tips?: string[];
  tipsEn?: string[];
  warnings?: string[];
  warningsEn?: string[];
  abilityDescription?: string;
  abilityDescriptionEn?: string;
  passiveAbility?: string;
  passiveAbilityEn?: string;
  priority: number;
  isMandatory?: boolean;
  nightAbilityKind: NightAbilityKind;
  dayAbilityKind?: DayAbilityKind;
  targetCount?: number;
  canTargetSelf?: boolean;
  canTargetAllies?: boolean;
  canTargetDead?: boolean;
  canTargetKing?: boolean;
  noRepeatTarget?: boolean;
  resultTiming?: ResultTiming;
  cooldown?: number;
  cooldownScale?: CooldownBracket[];
  cooldownOnFailureOnly?: boolean;
  spendsCooldownWhenBlocked?: boolean;
  maxUses?: number;
  immuneThroughNight?: number;
  winRequiresDeath?: boolean;
  constraints?: string[];
  constraintsEn?: string[];
  isDlc?: boolean;
  productId?: string;
}

export interface RolePrivate extends Role {
  // Secret details exposed only to owner
  unlockedAbilities?: string[];
}
