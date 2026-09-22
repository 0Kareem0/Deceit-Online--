"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const shared_1 = require("@deceit/shared");
const uuid_1 = require("uuid");
const RoleDistributor_1 = require("./RoleDistributor");
const NightResolver_1 = require("./NightResolver");
const VictoryEngine_1 = require("./VictoryEngine");
const BotAI_1 = require("./BotAI");
class GameEngine {
    matchId;
    roomCode;
    status = shared_1.GameStatus.notStarted;
    players;
    settings;
    turnOrder = [];
    currentNight = 1;
    nightActions = [];
    votes = [];
    victory = { kind: shared_1.VictoryKind.undecided };
    narration;
    eliminatedPlayer;
    pendingElimination;
    verdictAnnulled = false;
    votingClosed = false;
    voteRound = 1;
    runoffCandidates = [];
    currentVoterIndex = 0;
    stalledDays = 0;
    drawnByLot;
    timeline = [];
    phaseEndsAt;
    owedIntel = new Map();
    ministerRevealed = new Set();
    shadowRecommendation;
    victoryEngine = new VictoryEngine_1.VictoryEngine();
    constructor(roomCode, players, settings) {
        this.matchId = `m_${(0, uuid_1.v4)().substring(0, 8)}`;
        this.roomCode = roomCode;
        this.players = players;
        this.settings = settings;
    }
    setPhaseTimer(seconds) {
        this.phaseEndsAt = Date.now() + seconds * 1000;
    }
    initGame() {
        const distributed = RoleDistributor_1.RoleDistributor.distributeRoles(this.players, this.settings);
        this.players = distributed.players;
        this.turnOrder = distributed.turnOrder;
        this.status = shared_1.GameStatus.inRoleReveal;
        this.setPhaseTimer(15);
        this.timeline.push({
            id: `setup_${(0, uuid_1.v4)().substring(0, 6)}`,
            night: 0,
            phase: 'setup',
            title: 'انطلاق المباراة',
            description: 'بدأت المعركة بين قوى المملكة وشبح الظلال والشخصيات المحايدة.',
            isHighlight: true,
        });
    }
    startNight() {
        if (this.status === shared_1.GameStatus.inGameOver)
            return;
        this.status = shared_1.GameStatus.inNight;
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
                const botAction = BotAI_1.BotAI.decideNightAction(p, this);
                if (botAction) {
                    this.submitNightAction(botAction);
                }
            }
        }
    }
    submitNightAction(action) {
        if (this.status !== shared_1.GameStatus.inNight) {
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
        }
        else {
            this.nightActions.push(action);
        }
        // Auto-advance if all living active night roles have submitted their actions
        const activeNightRolesCount = this.players.filter((p) => p.isAlive && p.role && p.role.nightAbilityKind !== shared_1.NightAbilityKind.none).length;
        if (this.nightActions.length >= activeNightRolesCount) {
            this.resolveNight();
        }
        return { success: true };
    }
    resolveNight() {
        if (this.status !== shared_1.GameStatus.inNight)
            return;
        const resolver = new NightResolver_1.NightResolver(this.players, this.nightActions, this.currentNight, this.turnOrder, () => false);
        const outcome = resolver.resolve();
        this.shadowRecommendation = outcome.recommendation;
        // Handle Owed Intel
        for (const intel of outcome.intel) {
            if (!this.owedIntel.has(intel.playerId)) {
                this.owedIntel.set(intel.playerId, []);
            }
            this.owedIntel.get(intel.playerId).push(intel);
        }
        // Check poison deaths
        const poisonDeaths = [];
        for (const p of this.players) {
            if (p.isAlive && p.poisonedCount > 0) {
                p.poisonedCount--;
                if (p.poisonedCount === 0) {
                    p.isAlive = false;
                    p.eliminationCause = shared_1.EliminationCause.poisoned;
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
        this.status = shared_1.GameStatus.inMorning;
        this.setPhaseTimer(10);
        this.currentNight++;
        this.checkVictory();
    }
    startDiscussion() {
        this.status = shared_1.GameStatus.inDiscussion;
        this.setPhaseTimer(this.settings.discussionTimerSeconds || 60);
    }
    startVoting() {
        this.status = shared_1.GameStatus.inVoting;
        this.votes = [];
        this.votingClosed = false;
        this.currentVoterIndex = 0;
        this.setPhaseTimer(this.settings.votingTimerSeconds || 30);
        // Process Bot Votes
        for (const p of this.players) {
            if (p.isAlive && p.isBot) {
                const botVote = BotAI_1.BotAI.decideVote(p, this);
                this.submitVote(botVote);
            }
        }
    }
    submitVote(vote) {
        if (this.status !== shared_1.GameStatus.inVoting || this.votingClosed)
            return;
        const idx = this.votes.findIndex((v) => v.voterId === vote.voterId);
        if (idx >= 0) {
            this.votes[idx] = vote;
        }
        else {
            this.votes.push(vote);
        }
        this.currentVoterIndex++;
        const livingVoters = this.players.filter((p) => p.isAlive);
        if (this.votes.length >= livingVoters.length) {
            this.closeVoting();
        }
    }
    closeVoting() {
        this.votingClosed = true;
        const voteCounts = {};
        for (const v of this.votes) {
            if (v.targetId && v.targetId !== 'skip') {
                voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
            }
        }
        let maxVotes = 0;
        let candidates = [];
        for (const [targetId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                candidates = [targetId];
            }
            else if (count === maxVotes) {
                candidates.push(targetId);
            }
        }
        if (candidates.length === 1 && maxVotes > 0) {
            // Single condemned player
            this.pendingElimination = this.players.find((p) => p.id === candidates[0]);
            this.status = shared_1.GameStatus.inDayPowers;
            this.setPhaseTimer(15);
        }
        else if (candidates.length > 1 && this.voteRound === 1) {
            // Tie -> Runoff vote
            this.voteRound = 2;
            this.runoffCandidates = candidates
                .map((id) => this.players.find((p) => p.id === id))
                .filter((p) => p !== undefined);
            this.votes = [];
            this.votingClosed = false;
            this.setPhaseTimer(this.settings.votingTimerSeconds || 30);
        }
        else if (candidates.length > 1 && this.voteRound === 2) {
            // Runoff tied -> Draw by Lot (قرعة)
            const randomIdx = Math.floor(Math.random() * candidates.length);
            this.drawnByLot = this.players.find((p) => p.id === candidates[randomIdx]);
            this.pendingElimination = this.drawnByLot;
            this.status = shared_1.GameStatus.inDayPowers;
            this.setPhaseTimer(15);
        }
        else {
            // No votes cast -> Proceed without elimination
            this.pendingElimination = undefined;
            this.status = shared_1.GameStatus.inDayPowers;
            this.setPhaseTimer(15);
        }
    }
    vetoJudgeVote(judgeId) {
        const judge = this.players.find((p) => p.id === judgeId && p.isAlive && p.role?.id === 'judge');
        if (!judge || this.verdictAnnulled)
            return false;
        this.verdictAnnulled = true;
        this.pendingElimination = undefined;
        this.timeline.push({
            id: `judge_veto_${(0, uuid_1.v4)().substring(0, 6)}`,
            night: this.currentNight - 1,
            phase: 'dayPowers',
            title: 'مرسوم القاضي',
            description: 'تدخل القاضي وألغى نتيجة التصويت لحماية العدالة!',
            isHighlight: true,
        });
        return true;
    }
    applyVerdict() {
        if (this.verdictAnnulled) {
            this.verdictAnnulled = false;
        }
        else if (this.pendingElimination) {
            this.pendingElimination.isAlive = false;
            this.pendingElimination.eliminationCause = shared_1.EliminationCause.votedOut;
            this.eliminatedPlayer = this.pendingElimination;
            this.pendingElimination = undefined;
        }
        this.voteRound = 1;
        this.runoffCandidates = [];
        this.drawnByLot = undefined;
        this.status = shared_1.GameStatus.inElimination;
        this.setPhaseTimer(10);
        this.checkVictory();
    }
    checkVictory() {
        const outcome = this.victoryEngine.evaluate({
            players: this.players,
            settings: this.settings,
        });
        if (outcome.kind !== shared_1.VictoryKind.undecided) {
            this.victory = outcome;
            this.status = shared_1.GameStatus.inGameOver;
        }
        return outcome;
    }
    processMinisterIntel() {
        const minister = this.players.find((p) => p.isAlive && p.role?.id === 'minister');
        if (!minister)
            return;
        const candidates = this.players.filter((p) => p.isAlive && p.id !== minister.id && p.role);
        if (candidates.length === 0)
            return;
        const fresh = candidates.filter((p) => !this.ministerRevealed.has(p.id));
        const pool = fresh.length > 0 ? fresh : candidates;
        const target = pool[Math.floor(Math.random() * pool.length)];
        this.ministerRevealed.add(target.id);
        const intel = {
            playerId: minister.id,
            playerName: minister.name,
            roleId: 'minister',
            roleName: 'الوزير',
            roleIcon: '📜',
            title: 'تقرير الوزير السري',
            body: `${target.name} ينتمي إلى فريق ${target.role.faction === shared_1.Faction.kingdom ? 'المملكة' : target.role.faction === shared_1.Faction.shadow ? 'الظلال' : 'المحايدين'}.`,
            targetNames: [target.name],
            revealedFaction: target.role.faction,
            success: true,
        };
        if (!this.owedIntel.has(minister.id)) {
            this.owedIntel.set(minister.id, []);
        }
        this.owedIntel.get(minister.id).push(intel);
    }
    promoteCrownPrince() {
        const kingAlive = this.players.some((p) => p.isAlive && p.role?.id === 'king');
        if (kingAlive)
            return;
        const prince = this.players.find((p) => p.isAlive && p.role?.id === 'crown_prince');
        const fallenKing = this.players.find((p) => !p.isAlive && p.role?.id === 'king');
        if (prince && fallenKing && fallenKing.role) {
            prince.role = {
                ...fallenKing.role,
                lore: 'توليت العرش بعد سقوط الملك السابق.',
                warnings: ['موتك يعني انتصاراً فورياً للظلال.'],
            };
            this.timeline.push({
                id: `coronation_${(0, uuid_1.v4)().substring(0, 6)}`,
                night: this.currentNight - 1,
                phase: 'morning',
                title: 'تتويج ولي العهد',
                description: `تولى ولي العهد ${prince.name} العرش كملك جديد بعد سقوط الملك السابق.`,
                isHighlight: true,
            });
        }
    }
    buildMorningNarration(dead, saved, silenced) {
        const parts = [];
        if (dead.length > 0) {
            const names = dead.map((p) => p.name).join(' و ');
            parts.push(`أسدل الليل ستائره على فاجعة.. ابتلعت الظلال **${names}** ولم يتبقَ منهم سوى الذكرى.`);
        }
        else {
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
    getPublicGameState() {
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
    getPrivatePlayerState(playerId) {
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
        let allies;
        if (player.role?.faction === shared_1.Faction.shadow) {
            allies = this.players
                .filter((p) => p.role?.faction === shared_1.Faction.shadow && p.id !== playerId)
                .map((p) => ({ id: p.id, name: p.name, roleName: p.role?.name }));
        }
        const intel = this.owedIntel.get(playerId) || [];
        return {
            playerId,
            role: player.role,
            faction: player.role?.faction,
            allies,
            owedIntel: intel,
            canActTonight: player.isAlive && this.status === shared_1.GameStatus.inNight && !player.isAbilityBlocked,
            nightCooldownRemaining: player.nightCooldownEnd > this.currentNight ? player.nightCooldownEnd - this.currentNight : 0,
            dayCooldownRemaining: player.dayCooldownEnd > this.currentNight ? player.dayCooldownEnd - this.currentNight : 0,
            hasUsedBonusAttack: player.hasUsedBonusAttack,
            shadowRecommendation: player.role?.id === 'assassin' ? this.shadowRecommendation : undefined,
        };
    }
    toPublicPlayer(p) {
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
            roleRevealed: shouldRevealRole || this.status === shared_1.GameStatus.inGameOver ? p.role : undefined,
            isSilenced: p.isSilenced,
        };
    }
}
exports.GameEngine = GameEngine;
