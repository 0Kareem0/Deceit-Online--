"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VictoryEngine = exports.ShadowsBreakParityRule = exports.ShadowsOutnumberRule = exports.ShadowsEliminatedRule = exports.KingMustSurviveRule = exports.TricksterRule = exports.VictoryRule = void 0;
const shared_1 = require("@deceit/shared");
class VictoryRule {
}
exports.VictoryRule = VictoryRule;
class TricksterRule extends VictoryRule {
    id = 'trickster_voted_out';
    evaluate(context) {
        const tricksterWinners = context.players.filter((p) => p.role?.id === 'trickster' &&
            !p.isAlive &&
            p.eliminationCause === shared_1.EliminationCause.votedOut);
        if (tricksterWinners.length > 0) {
            return {
                kind: shared_1.VictoryKind.solo,
                winnerIds: tricksterWinners.map((p) => p.id),
                ruleId: this.id,
                reason: 'نجح المخادع في إقناع الجميع بالتصويت على استبعاده وفاز بمفرده!',
            };
        }
        return null;
    }
}
exports.TricksterRule = TricksterRule;
class KingMustSurviveRule extends VictoryRule {
    id = 'king_must_survive';
    evaluate(context) {
        if (!context.settings.kingMustSurvive)
            return null;
        const hasLivingKing = context.players.some((p) => p.isAlive && p.role?.id === 'king');
        if (!hasLivingKing) {
            return {
                kind: shared_1.VictoryKind.faction,
                faction: shared_1.Faction.shadow,
                ruleId: this.id,
                reason: 'خلا منصب العرش وسقط الملك، فانتصرت الظلال على المملكة!',
            };
        }
        return null;
    }
}
exports.KingMustSurviveRule = KingMustSurviveRule;
class ShadowsEliminatedRule extends VictoryRule {
    id = 'shadows_eliminated';
    evaluate(context) {
        const livingShadows = context.players.filter((p) => p.isAlive && p.role?.faction === shared_1.Faction.shadow);
        if (livingShadows.length === 0) {
            return {
                kind: shared_1.VictoryKind.faction,
                faction: shared_1.Faction.kingdom,
                ruleId: this.id,
                reason: 'تم القضاء على جميع أعضاء الظلال وحماية العرش والمملكة!',
            };
        }
        return null;
    }
}
exports.ShadowsEliminatedRule = ShadowsEliminatedRule;
class ShadowsOutnumberRule extends VictoryRule {
    id = 'shadows_outnumber';
    evaluate(context) {
        const livingKingdom = context.players.filter((p) => p.isAlive && p.role?.faction === shared_1.Faction.kingdom).length;
        const livingShadows = context.players.filter((p) => p.isAlive && p.role?.faction === shared_1.Faction.shadow).length;
        if (livingShadows > livingKingdom) {
            return {
                kind: shared_1.VictoryKind.faction,
                faction: shared_1.Faction.shadow,
                ruleId: this.id,
                reason: 'أصبح عدد أعضاء الظلال أكثر من فريق المملكة، وسيطروا على الحكم!',
            };
        }
        return null;
    }
}
exports.ShadowsOutnumberRule = ShadowsOutnumberRule;
class ShadowsBreakParityRule extends VictoryRule {
    id = 'shadows_break_parity';
    evaluate(context) {
        // Parity victory should only evaluate after Night 1 (i.e. at least round 1 discussion or Night 2)
        if (context.currentNight !== undefined && context.currentNight <= 1) {
            return null;
        }
        const livingKingdom = context.players.filter((p) => p.isAlive && p.role?.faction === shared_1.Faction.kingdom);
        const livingShadows = context.players.filter((p) => p.isAlive && p.role?.faction === shared_1.Faction.shadow);
        if (livingKingdom.length !== livingShadows.length || livingShadows.length === 0) {
            return null;
        }
        // Check if Shadows have active kill/poison capability
        const hasKiller = livingShadows.some((p) => [shared_1.NightAbilityKind.attack, shared_1.NightAbilityKind.poison].includes(p.role?.nightAbilityKind || shared_1.NightAbilityKind.none));
        // Check if Kingdom has protection healer
        const hasGuard = livingKingdom.some((p) => p.role?.nightAbilityKind === shared_1.NightAbilityKind.protect);
        const hasHealer = livingKingdom.some((p) => p.role?.nightAbilityKind === shared_1.NightAbilityKind.heal);
        if (hasKiller && !hasGuard && !hasHealer) {
            return {
                kind: shared_1.VictoryKind.faction,
                faction: shared_1.Faction.shadow,
                ruleId: this.id,
                reason: 'تساوى الفريقان والظلال قادرة على حسم المعركة هذه الليلة!',
            };
        }
        return null;
    }
}
exports.ShadowsBreakParityRule = ShadowsBreakParityRule;
class VictoryEngine {
    rules = [
        new TricksterRule(),
        new KingMustSurviveRule(),
        new ShadowsEliminatedRule(),
        new ShadowsOutnumberRule(),
        new ShadowsBreakParityRule(),
    ];
    evaluate(context) {
        for (const rule of this.rules) {
            const result = rule.evaluate(context);
            if (result)
                return result;
        }
        return { kind: shared_1.VictoryKind.undecided };
    }
}
exports.VictoryEngine = VictoryEngine;
