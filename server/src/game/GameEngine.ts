import {
  Player,
  PlayerPublic,
  MatchSettings,
  GameStatus,
  NightAction,
  Vote,
  VictoryOutcome,
  VictoryKind,
  TimelineEvent,
  PublicGameState,
  PrivatePlayerState,
  PrivateIntel,
  Faction,
  EliminationCause,
  NightAbilityKind,
} from '@deceit/shared';
import { v4 as uuidv4 } from 'uuid';
import { RoleDistributor } from './RoleDistributor';
import { NightResolver } from './NightResolver';
import { VictoryEngine } from './VictoryEngine';
import { BotAI } from './BotAI';

export class GameEngine {
  public matchId: string;
  public roomCode: string;
  public status: GameStatus = GameStatus.notStarted;
  public players: Player[];
  public settings: MatchSettings;
  public turnOrder: string[] = [];
  public currentNight = 1;
  public nightActions: NightAction[] = [];
  public votes: Vote[] = [];
  public victory: VictoryOutcome = { kind: VictoryKind.undecided };
  public narration?: string;
  public eliminatedPlayer?: Player;
  public pendingElimination?: Player;
  public verdictAnnulled = false;
  public votingClosed = false;
  public voteRound = 1;
  public runoffCandidates: Player[] = [];
  public currentVoterIndex = 0;
  public stalledDays = 0;
  public drawnByLot?: Player;
  public timeline: TimelineEvent[] = [];
  public phaseEndsAt?: number;

  private owedIntel: Map<string, PrivateIntel[]> = new Map();
  private ministerRevealed: Set<string> = new Set();
  private shadowRecommendation?: string;
  private victoryEngine = new VictoryEngine();

  constructor(roomCode: string, players: Player[], settings: MatchSettings) {
    this.matchId = `m_${uuidv4().substring(0, 8)}`;
    this.roomCode = roomCode;
    this.players = players;
    this.settings = settings;
  }

  public setPhaseTimer(seconds: number): void {
    this.phaseEndsAt = Date.now() + seconds * 1000;
  }

  public initGame(): void {
    const distributed = RoleDistributor.distributeRoles(this.players, this.settings);
    this.players = distributed.players;
    this.turnOrder = distributed.turnOrder;
    this.status = GameStatus.inRoleReveal;
    this.setPhaseTimer(15);

    this.timeline.push({
      id: `setup_${uuidv4().substring(0, 6)}`,
      night: 0,
      phase: 'setup',
      title: 'انطلاق المباراة',
      description: 'بدأت المعركة بين قوى المملكة وشبح الظلال والشخصيات المحايدة.',
      isHighlight: true,
    });
  }

  public startNight(): void {
    if (this.status === GameStatus.inGameOver) return;
    this.status = GameStatus.inNight;
    this.nightActions = [];
    this.setPhaseTimer(this.settings.abilityTimerSeconds || 40);

    // Clear previous day silences
    for (const p of this.players) {
      p.isSilenced = false;
    }

    // Process Minister Intel
    this.processMinisterIntel();

    // Process Bot Night Actions
    for (const p of this.players) {
      if (p.isAlive && p.isBot) {
        const botAction = BotAI.decideNightAction(p, this);
        if (botAction) {
          this.submitNightAction(botAction);
        }
      }
    }
  }

  public submitNightAction(action: NightAction): { success: boolean; error?: string } {
    if (this.status !== GameStatus.inNight) {
      return { success: false, error: 'ليس وقت الليلة حالياً.' };
    }

    const actor = this.players.find((p) => p.id === action.playerId);
    if (!actor || !actor.isAlive) {
      return { success: false, error: 'اللاعب غير متاح.' };
    }

    // Replace existing action if player already acted
    const existingIdx = this.nightActions.findIndex((a) => a.playerId === action.playerId);
    if (existingIdx >= 0) {
      this.nightActions[existingIdx] = action;
    } else {
      this.nightActions.push(action);
    }

    // Auto-advance if all living active night roles have submitted their actions
    const activeNightRolesCount = this.players.filter(
      (p) => p.isAlive && p.role && p.role.nightAbilityKind !== NightAbilityKind.none
    ).length;

    if (this.nightActions.length >= activeNightRolesCount) {
      this.resolveNight();
    }

    return { success: true };
  }

  public resolveNight(): void {
    if (this.status !== GameStatus.inNight) return;

    const resolver = new NightResolver(
      this.players,
      this.nightActions,
      this.currentNight,
      this.turnOrder,
      () => false
    );

    const outcome = resolver.resolve();
    this.shadowRecommendation = outcome.recommendation;

    // Handle Owed Intel
    for (const intel of outcome.intel) {
      if (!this.owedIntel.has(intel.playerId)) {
        this.owedIntel.set(intel.playerId, []);
      }
      this.owedIntel.get(intel.playerId)!.push(intel);
    }

    // Check poison deaths
    const poisonDeaths: Player[] = [];
    for (const p of this.players) {
      if (p.isAlive && p.poisonedCount > 0) {
        p.poisonedCount--;
        if (p.poisonedCount === 0) {
          p.isAlive = false;
          p.eliminationCause = EliminationCause.poisoned;
          poisonDeaths.push(p);
        }
      }
    }

    const totalDead = [...outcome.killed, ...poisonDeaths];
    if (totalDead.length > 0) {
      this.stalledDays = 0;
    }

    this.promoteCrownPrince();
    this.narration = this.buildMorningNarration(totalDead, outcome.saved, outcome.silenced);

    // Clear night state
    for (const p of this.players) {
      p.isAbilityBlocked = false;
    }
    this.nightActions = [];
    this.status = GameStatus.inMorning;
    this.setPhaseTimer(10);
    this.currentNight++;

    this.checkVictory();
  }

  public startDiscussion(): void {
    this.status = GameStatus.inDiscussion;
    this.setPhaseTimer(this.settings.discussionTimerSeconds || 60);
  }

  public startVoting(): void {
    this.status = GameStatus.inVoting;
    this.votes = [];
    this.votingClosed = false;
    this.currentVoterIndex = 0;
    this.setPhaseTimer(this.settings.votingTimerSeconds || 30);

    // Process Bot Votes
    for (const p of this.players) {
      if (p.isAlive && p.isBot) {
        const botVote = BotAI.decideVote(p, this);
        this.submitVote(botVote);
      }
    }
  }

  public submitVote(vote: Vote): void {
    if (this.status !== GameStatus.inVoting || this.votingClosed) return;

    const idx = this.votes.findIndex((v) => v.voterId === vote.voterId);
    if (idx >= 0) {
      this.votes[idx] = vote;
    } else {
      this.votes.push(vote);
    }

    this.currentVoterIndex++;
    const livingVoters = this.players.filter((p) => p.isAlive);
    if (this.votes.length >= livingVoters.length) {
      this.closeVoting();
    }
  }

  public closeVoting(): void {
    this.votingClosed = true;
    const voteCounts: Record<string, number> = {};
    for (const v of this.votes) {
      if (v.targetId && v.targetId !== 'skip') {
        voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let candidates: string[] = [];
    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidates = [targetId];
      } else if (count === maxVotes) {
        candidates.push(targetId);
      }
    }

    if (candidates.length === 1 && maxVotes > 0) {
      // Single condemned player
      this.pendingElimination = this.players.find((p) => p.id === candidates[0]);
      this.status = GameStatus.inDayPowers;
      this.setPhaseTimer(15);
    } else if (candidates.length > 1 && this.voteRound === 1) {
      // Tie -> Runoff vote
      this.voteRound = 2;
      this.runoffCandidates = candidates
        .map((id) => this.players.find((p) => p.id === id))
        .filter((p): p is Player => p !== undefined);
      this.votes = [];
      this.votingClosed = false;
      this.setPhaseTimer(this.settings.votingTimerSeconds || 30);
    } else if (candidates.length > 1 && this.voteRound === 2) {
      // Runoff tied -> Draw by Lot (قرعة)
      const randomIdx = Math.floor(Math.random() * candidates.length);
      this.drawnByLot = this.players.find((p) => p.id === candidates[randomIdx]);
      this.pendingElimination = this.drawnByLot;
      this.status = GameStatus.inDayPowers;
      this.setPhaseTimer(15);
    } else {
      // No votes cast -> Proceed without elimination
      this.pendingElimination = undefined;
      this.status = GameStatus.inDayPowers;
      this.setPhaseTimer(15);
    }
  }

  public vetoJudgeVote(judgeId: string): boolean {
    const judge = this.players.find((p) => p.id === judgeId && p.isAlive && p.role?.id === 'judge');
    if (!judge || this.verdictAnnulled) return false;

    this.verdictAnnulled = true;
    this.pendingElimination = undefined;
    this.timeline.push({
      id: `judge_veto_${uuidv4().substring(0, 6)}`,
      night: this.currentNight - 1,
      phase: 'dayPowers',
      title: 'مرسوم القاضي',
      description: 'تدخل القاضي وألغى نتيجة التصويت لحماية العدالة!',
      isHighlight: true,
    });
    return true;
  }

  public applyVerdict(): void {
    if (this.verdictAnnulled) {
      this.verdictAnnulled = false;
    } else if (this.pendingElimination) {
      this.pendingElimination.isAlive = false;
      this.pendingElimination.eliminationCause = EliminationCause.votedOut;
      this.eliminatedPlayer = this.pendingElimination;
      this.pendingElimination = undefined;
    }
    this.voteRound = 1;
    this.runoffCandidates = [];
    this.drawnByLot = undefined;
    this.status = GameStatus.inElimination;
    this.setPhaseTimer(10);

    this.checkVictory();
  }

  public checkVictory(): VictoryOutcome {
    const outcome = this.victoryEngine.evaluate({
      players: this.players,
      settings: this.settings,
    });

    if (outcome.kind !== VictoryKind.undecided) {
      this.victory = outcome;
      this.status = GameStatus.inGameOver;
    }
    return outcome;
  }

  private processMinisterIntel(): void {
    const minister = this.players.find((p) => p.isAlive && p.role?.id === 'minister');
    if (!minister) return;

    const candidates = this.players.filter((p) => p.isAlive && p.id !== minister.id && p.role);
    if (candidates.length === 0) return;

    const fresh = candidates.filter((p) => !this.ministerRevealed.has(p.id));
    const pool = fresh.length > 0 ? fresh : candidates;
    const target = pool[Math.floor(Math.random() * pool.length)];
    this.ministerRevealed.add(target.id);

    const intel: PrivateIntel = {
      playerId: minister.id,
      playerName: minister.name,
      roleId: 'minister',
      roleName: 'الوزير',
      roleIcon: '📜',
      title: 'تقرير الوزير السري',
      body: `${target.name} ينتمي إلى فريق ${
        target.role!.faction === Faction.kingdom ? 'المملكة' : target.role!.faction === Faction.shadow ? 'الظلال' : 'المحايدين'
      }.`,
      targetNames: [target.name],
      revealedFaction: target.role!.faction,
      success: true,
    };

    if (!this.owedIntel.has(minister.id)) {
      this.owedIntel.set(minister.id, []);
    }
    this.owedIntel.get(minister.id)!.push(intel);
  }

  private promoteCrownPrince(): void {
    const kingAlive = this.players.some((p) => p.isAlive && p.role?.id === 'king');
    if (kingAlive) return;

    const prince = this.players.find((p) => p.isAlive && p.role?.id === 'crown_prince');
    const fallenKing = this.players.find((p) => !p.isAlive && p.role?.id === 'king');

    if (prince && fallenKing && fallenKing.role) {
      prince.role = {
        ...fallenKing.role,
        lore: 'توليت العرش بعد سقوط الملك السابق.',
        warnings: ['موتك يعني انتصاراً فورياً للظلال.'],
      };
      this.timeline.push({
        id: `coronation_${uuidv4().substring(0, 6)}`,
        night: this.currentNight - 1,
        phase: 'morning',
        title: 'تتويج ولي العهد',
        description: `تولى ولي العهد ${prince.name} العرش كملك جديد بعد سقوط الملك السابق.`,
        isHighlight: true,
      });
    }
  }

  private buildMorningNarration(dead: Player[], saved: Player[], silenced: Player[]): string {
    const parts: string[] = [];
    if (dead.length > 0) {
      const names = dead.map((p) => p.name).join(' و ');
      parts.push(`أسدل الليل ستائره على فاجعة.. ابتلعت الظلال **${names}** ولم يتبقَ منهم سوى الذكرى.`);
    } else {
      parts.push('أشرقت الشمس بلا قطرة دم واحدة.. تحطمت مكائد الظلال قبل أن ترى النور.');
    }
    if (saved.length > 0) {
      const names = saved.map((p) => p.name).join(' و ');
      parts.push(`تدخلت عناية خفية لإنقاذ **${names}** من شبح الهلاك.`);
    }
    if (silenced.length > 0) {
      const names = silenced.map((p) => p.name).join(' و ');
      parts.push(`استيقظ **${names}** اليوم مكبل اللسان بفضل سحر قديم.`);
    }
    return parts.join('\n\n');
  }

  // --- State Projection Sanitizers ---

  public getPublicGameState(): PublicGameState {
    return {
      matchId: this.matchId,
      roomCode: this.roomCode,
      status: this.status,
      currentNight: this.currentNight,
      dayNumber: this.currentNight - 1,
      phaseEndsAt: this.phaseEndsAt,
      players: this.players.map((p) => this.toPublicPlayer(p)),
      aliveCount: this.players.filter((p) => p.isAlive).length,
      eliminatedPlayer: this.eliminatedPlayer ? this.toPublicPlayer(this.eliminatedPlayer) : undefined,
      narration: this.narration,
      activeEvents: [],
      runoffPending: this.runoffCandidates.length > 0,
      runoffCandidates: this.runoffCandidates.map((p) => this.toPublicPlayer(p)),
      currentVoterId: this.players.filter((p) => p.isAlive)[this.currentVoterIndex]?.id,
      victory: this.victory,
      gameTimeline: this.timeline,
    };
  }

  public getPrivatePlayerState(playerId: string): PrivatePlayerState {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      return {
        playerId,
        owedIntel: [],
        canActTonight: false,
        nightCooldownRemaining: 0,
        dayCooldownRemaining: 0,
      };
    }

    // Shadow Ally Awareness
    let allies: { id: string; name: string; roleName?: string }[] | undefined;
    if (player.role?.faction === Faction.shadow) {
      allies = this.players
        .filter((p) => p.role?.faction === Faction.shadow && p.id !== playerId)
        .map((p) => ({ id: p.id, name: p.name, roleName: p.role?.name }));
    }

    const intel = this.owedIntel.get(playerId) || [];

    return {
      playerId,
      role: player.role,
      faction: player.role?.faction,
      allies,
      owedIntel: intel,
      canActTonight: player.isAlive && this.status === GameStatus.inNight && !player.isAbilityBlocked,
      nightCooldownRemaining: player.nightCooldownEnd > this.currentNight ? player.nightCooldownEnd - this.currentNight : 0,
      dayCooldownRemaining: player.dayCooldownEnd > this.currentNight ? player.dayCooldownEnd - this.currentNight : 0,
      hasUsedBonusAttack: player.hasUsedBonusAttack,
      shadowRecommendation: player.role?.id === 'assassin' ? this.shadowRecommendation : undefined,
    };
  }

  private toPublicPlayer(p: Player): PlayerPublic {
    const isEliminated = !p.isAlive;
    const shouldRevealRole = isEliminated && this.settings.revealEliminatedRole;
    return {
      id: p.id,
      name: p.name,
      gender: p.gender,
      isHost: p.isHost,
      isReady: p.isReady,
      isOnline: p.isOnline,
      isAlive: p.isAlive,
      eliminationCause: isEliminated ? p.eliminationCause : undefined,
      roleRevealed: shouldRevealRole || this.status === GameStatus.inGameOver ? p.role : undefined,
      isSilenced: p.isSilenced,
    };
  }
}
