import { Player, NightAction, Vote, Faction, NightAbilityKind, Gender, EliminationCause } from '@deceit/shared';
import { GameEngine } from './GameEngine';

export const BOT_NAMES: { name: string; gender: Gender }[] = [
  { name: 'بوت — صقر', gender: Gender.male },
  { name: 'بوت — مريم', gender: Gender.female },
  { name: 'بوت — شهاب', gender: Gender.male },
  { name: 'بوت — ياسمين', gender: Gender.female },
  { name: 'بوت — طارق', gender: Gender.male },
  { name: 'بوت — سارة', gender: Gender.female },
  { name: 'بوت — حمزة', gender: Gender.male },
  { name: 'بوت — نور', gender: Gender.female },
  { name: 'بوت — زياد', gender: Gender.male },
  { name: 'بوت — ليلى', gender: Gender.female },
  { name: 'بوت — بدر', gender: Gender.male },
  { name: 'بوت — سلمى', gender: Gender.female },

  { name: 'بوت — فارس', gender: Gender.male },
  { name: 'بوت — ريم', gender: Gender.female },
  { name: 'بوت — وليد', gender: Gender.male },
];

export class BotAI {
  /**
   * Generates a smart night action for a bot player based on their role and game state.
   */
  public static decideNightAction(bot: Player, engine: GameEngine): NightAction | null {
    if (!bot.isAlive || !bot.role || bot.isAbilityBlocked) return null;
    const role = bot.role;
    if (role.nightAbilityKind === NightAbilityKind.none) return null;

    const livingPlayers = engine.players.filter((p) => p.isAlive);
    const livingOthers = livingPlayers.filter((p) => p.id !== bot.id);
    if (livingOthers.length === 0) return null;

    const livingKingdom = livingOthers.filter((p) => p.role?.faction === Faction.kingdom);
    const livingShadows = livingOthers.filter((p) => p.role?.faction === Faction.shadow);

    let targetIds: string[] = [];

    switch (role.nightAbilityKind) {
      case NightAbilityKind.attack: {
        // Assassin / Slasher Bot:
        // Priority 1: Follow Shadow Leader recommendation if valid (70% probability)
        const rec = (engine as any).shadowRecommendation;
        if (rec && Math.random() < 0.7) {
          const recPlayer = livingKingdom.find((p) => p.name === rec);
          if (recPlayer) {
            targetIds = [recPlayer.id];
            break;
          }
        }

        // Priority 2: Target King if living
        const king = livingKingdom.find((p) => p.role?.id === 'king');
        if (king && Math.random() < 0.8) {
          targetIds = [king.id];
          break;
        }

        // Priority 3: Target key Kingdom roles (Minister, Seer, Guard, Doctor)
        const priorityRoles = ['minister', 'investigator', 'guard', 'doctor'];
        const priorityTarget = livingKingdom.find((p) => priorityRoles.includes(p.role?.id || ''));
        if (priorityTarget) {
          targetIds = [priorityTarget.id];
        } else if (livingKingdom.length > 0) {
          const randIdx = Math.floor(Math.random() * livingKingdom.length);
          targetIds = [livingKingdom[randIdx].id];
        }
        break;
      }

      case NightAbilityKind.mark: {
        // Shadow Leader Bot: Mark high-value Kingdom target (avoid Hermit on Night 1-2)
        const validKingdom = livingKingdom.filter(
          (p) => !(p.role?.id === 'hermit' && engine.currentNight <= 2)
        );

        const king = validKingdom.find((p) => p.role?.id === 'king');
        if (king) {
          targetIds = [king.id];
        } else if (validKingdom.length > 0) {
          const randIdx = Math.floor(Math.random() * validKingdom.length);
          targetIds = [validKingdom[randIdx].id];
        }
        break;
      }

      case NightAbilityKind.protect: {
        // Guard Bot: Protect King > Minister/Seer/Doctor > Self
        const king = livingPlayers.find((p) => p.isAlive && p.role?.id === 'king');
        if (king) {
          targetIds = [king.id];
        } else {
          const keyRole = livingPlayers.find((p) => p.isAlive && ['minister', 'doctor', 'investigator'].includes(p.role?.id || ''));
          targetIds = keyRole ? [keyRole.id] : [bot.id];
        }
        break;
      }

      case NightAbilityKind.heal: {
        // Doctor Bot: Heal poisoned target if any > King > Self
        const poisoned = livingPlayers.find((p) => p.isAlive && p.poisonedCount > 0);
        if (poisoned) {
          targetIds = [poisoned.id];
        } else {
          const king = livingPlayers.find((p) => p.isAlive && p.role?.id === 'king');
          // Avoid self-heal twice in a row rule
          if (bot.lastTargetId === bot.id && livingOthers.length > 0) {
            targetIds = [king ? king.id : livingOthers[0].id];
          } else {
            targetIds = [king ? king.id : bot.id];
          }
        }
        break;
      }

      case NightAbilityKind.investigate: {
        // Investigator (Seer) Bot: Inspect non-self, non-checked living player
        const randIdx = Math.floor(Math.random() * livingOthers.length);
        targetIds = [livingOthers[randIdx].id];
        break;
      }

      case NightAbilityKind.block: {
        // Saboteur Bot: Block active Kingdom roles
        const activeKingdom = livingKingdom.filter(
          (p) =>
            (p.role?.nightAbilityKind && p.role.nightAbilityKind !== NightAbilityKind.none) ||
            p.role?.id === 'investigator' ||
            p.role?.id === 'doctor'
        );
        if (activeKingdom.length > 0) {
          targetIds = [activeKingdom[0].id];
        } else if (livingOthers.length > 0) {
          targetIds = [livingOthers[0].id];
        }
        break;
      }

      case NightAbilityKind.frame: {
        // Forger Bot: Frame a Kingdom player
        if (livingKingdom.length > 0) {
          const randIdx = Math.floor(Math.random() * livingKingdom.length);
          targetIds = [livingKingdom[randIdx].id];
        }
        break;
      }

      case NightAbilityKind.poison: {
        // Poisoner Bot: Poison high value target
        const king = livingKingdom.find((p) => p.role?.id === 'king');
        if (king) {
          targetIds = [king.id];
        } else if (livingKingdom.length > 0) {
          const randIdx = Math.floor(Math.random() * livingKingdom.length);
          targetIds = [livingKingdom[randIdx].id];
        }
        break;
      }

      case NightAbilityKind.silence: {
        // Wizard Bot: Silence a random living player
        if (livingOthers.length > 0) {
          const randIdx = Math.floor(Math.random() * livingOthers.length);
          targetIds = [livingOthers[randIdx].id];
        }
        break;
      }

      case NightAbilityKind.compare: {
        // Messenger Bot: Compare 2 living targets
        if (livingOthers.length >= 2) {
          targetIds = [livingOthers[0].id, livingOthers[1].id];
        }
        break;
      }

      case NightAbilityKind.watch: {
        // Spy Bot: Watch King or Minister
        const king = livingOthers.find((p) => p.role?.id === 'king');
        targetIds = [king ? king.id : livingOthers[0].id];
        break;
      }

      case NightAbilityKind.copy: {
        // Impersonator Bot: Copy first active role and target legal candidate
        const activePlayer = livingOthers.find((p) => p.role?.nightAbilityKind === NightAbilityKind.attack || p.role?.nightAbilityKind === NightAbilityKind.protect);
        if (activePlayer && livingOthers.length >= 2) {
          const victim = livingOthers.find((p) => p.id !== activePlayer.id);
          if (victim) {
            targetIds = [activePlayer.id, victim.id];
          }
        }
        break;
      }

      default:
        break;
    }

    if (targetIds.length === 0) return null;

    bot.lastTargetId = targetIds[0];
    return {
      playerId: bot.id,
      targetIds,
    };
  }

  /**
   * Generates a smart vote for a bot player.
   */
  public static decideVote(bot: Player, engine: GameEngine): Vote {
    const livingOthers = engine.players.filter((p) => p.isAlive && p.id !== bot.id);
    if (livingOthers.length === 0) {
      return { voterId: bot.id, targetId: 'skip' };
    }

    // Shadow bots vote in coordination against Kingdom members
    if (bot.role?.faction === Faction.shadow) {
      const livingKingdom = livingOthers.filter((p) => p.role?.faction === Faction.kingdom);
      if (livingKingdom.length > 0) {
        // Focus fire on the first Kingdom member (e.g. King or Minister)
        const king = livingKingdom.find((p) => p.role?.id === 'king');
        const target = king || livingKingdom[0];
        return { voterId: bot.id, targetId: target.id };
      }
    }

    // Kingdom / Neutral bots vote with slight randomness or consensus
    const randIdx = Math.floor(Math.random() * livingOthers.length);
    return {
      voterId: bot.id,
      targetId: livingOthers[randIdx].id,
    };
  }
}
