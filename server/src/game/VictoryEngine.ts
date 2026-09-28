import {
  Player,
  Faction,
  VictoryOutcome,
  VictoryKind,
  MatchSettings,
  EliminationCause,
  NightAbilityKind,
} from '@deceit/shared';

export interface VictoryContext {
  players: Player[];
  settings: MatchSettings;
  currentNight?: number;
}

export abstract class VictoryRule {
  abstract id: string;
  abstract evaluate(context: VictoryContext): VictoryOutcome | null;
}

export class TricksterRule extends VictoryRule {
  id = 'trickster_voted_out';
  evaluate(context: VictoryContext): VictoryOutcome | null {
    const tricksterWinners = context.players.filter(
      (p) =>
        p.role?.id === 'trickster' &&
        !p.isAlive &&
        p.eliminationCause === EliminationCause.votedOut
    );

    if (tricksterWinners.length > 0) {
      return {
        kind: VictoryKind.solo,
        winnerIds: tricksterWinners.map((p) => p.id),
        ruleId: this.id,
        reason: 'نجح المخادع في إقناع الجميع بالتصويت على استبعاده وفاز بمفرده!',
      };
    }
    return null;
  }
}

export class KingMustSurviveRule extends VictoryRule {
  id = 'king_must_survive';
  evaluate(context: VictoryContext): VictoryOutcome | null {
    if (!context.settings.kingMustSurvive) return null;
    const hasLivingKing = context.players.some((p) => p.isAlive && p.role?.id === 'king');
    if (!hasLivingKing) {
      return {
        kind: VictoryKind.faction,
        faction: Faction.shadow,
        ruleId: this.id,
        reason: 'خلا منصب العرش وسقط الملك، فانتصرت الظلال على المملكة!',
      };
    }
    return null;
  }
}

export class ShadowsEliminatedRule extends VictoryRule {
  id = 'shadows_eliminated';
  evaluate(context: VictoryContext): VictoryOutcome | null {
    const livingShadows = context.players.filter(
      (p) => p.isAlive && p.role?.faction === Faction.shadow
    );
    if (livingShadows.length === 0) {
      return {
        kind: VictoryKind.faction,
        faction: Faction.kingdom,
        ruleId: this.id,
        reason: 'تم القضاء على جميع أعضاء الظلال وحماية العرش والمملكة!',
      };
    }
    return null;
  }
}

export class ShadowsOutnumberRule extends VictoryRule {
  id = 'shadows_outnumber';
  evaluate(context: VictoryContext): VictoryOutcome | null {
    const livingKingdom = context.players.filter(
      (p) => p.isAlive && p.role?.faction === Faction.kingdom
    ).length;
    const livingShadows = context.players.filter(
      (p) => p.isAlive && p.role?.faction === Faction.shadow
    ).length;

    if (livingShadows > livingKingdom) {
      return {
        kind: VictoryKind.faction,
        faction: Faction.shadow,
        ruleId: this.id,
        reason: 'أصبح عدد أعضاء الظلال أكثر من فريق المملكة، وسيطروا على الحكم!',
      };
    }
    return null;
  }
}

export class ShadowsBreakParityRule extends VictoryRule {
  id = 'shadows_break_parity';
  evaluate(context: VictoryContext): VictoryOutcome | null {
    // Parity victory should only evaluate after Night 1 (i.e. at least round 1 discussion or Night 2)
    if (context.currentNight !== undefined && context.currentNight <= 1) {
      return null;
    }

    const livingKingdom = context.players.filter(
      (p) => p.isAlive && p.role?.faction === Faction.kingdom
    );
    const livingShadows = context.players.filter(
      (p) => p.isAlive && p.role?.faction === Faction.shadow
    );

    if (livingKingdom.length !== livingShadows.length || livingShadows.length === 0) {
      return null;
    }

    // Check if Shadows have active kill/poison capability
    const hasKiller = livingShadows.some((p) =>
      [NightAbilityKind.attack, NightAbilityKind.poison].includes(p.role?.nightAbilityKind || NightAbilityKind.none)
    );

    // Check if Kingdom has protection healer
    const hasGuard = livingKingdom.some((p) => p.role?.nightAbilityKind === NightAbilityKind.protect);
    const hasHealer = livingKingdom.some((p) => p.role?.nightAbilityKind === NightAbilityKind.heal);

    if (hasKiller && !hasGuard && !hasHealer) {
      return {
        kind: VictoryKind.faction,
        faction: Faction.shadow,
        ruleId: this.id,
        reason: 'تساوى الفريقان والظلال قادرة على حسم المعركة هذه الليلة!',
      };
    }
    return null;
  }
}

export class VictoryEngine {
  private rules: VictoryRule[] = [
    new TricksterRule(),
    new KingMustSurviveRule(),
    new ShadowsEliminatedRule(),
    new ShadowsOutnumberRule(),
    new ShadowsBreakParityRule(),
  ];

  public evaluate(context: VictoryContext): VictoryOutcome {
    for (const rule of this.rules) {
      const result = rule.evaluate(context);
      if (result) return result;
    }
    return { kind: VictoryKind.undecided };
  }
}
