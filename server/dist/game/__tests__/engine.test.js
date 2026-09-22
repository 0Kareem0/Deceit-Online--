"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const GameEngine_1 = require("../GameEngine");
const RoleDistributor_1 = require("../RoleDistributor");
const VictoryEngine_1 = require("../VictoryEngine");
const NightResolver_1 = require("../NightResolver");
const shared_1 = require("@deceit/shared");
const roleData_1 = require("../roleData");
(0, node_test_1.describe)('GameEngine & Rules Unit Tests', () => {
    const dummySettings = {
        revealEliminatedRole: true,
        kingMustSurvive: true,
        enableNarrator: true,
        enableMusic: true,
        enableSfx: true,
        discussionTimerSeconds: 60,
        votingTimerSeconds: 30,
        enableAbilityTimer: false,
        abilityTimerSeconds: 15,
        eventsEnabled: false,
        enabledEvents: [],
        randomEvents: false,
        maxEventsPerMatch: 1,
        enabledCoreRoles: [],
        enableScoring: true,
        includeNeutrals: true,
        enabledRoleIds: [],
    };
    const createDummyPlayers = (count) => {
        const players = [];
        for (let i = 0; i < count; i++) {
            players.push({
                id: `p_${i + 1}`,
                name: `Player_${i + 1}`,
                gender: 'male',
                isHost: i === 0,
                isReady: true,
                isOnline: true,
                isAlive: true,
                eliminationCause: shared_1.EliminationCause.none,
                poisonedCount: 0,
                isSilenced: false,
                isAbilityBlocked: false,
                nightCooldownEnd: 0,
                dayCooldownEnd: 0,
                abilityUsesCount: 0,
                successfulAbilityUsesCount: 0,
                hasUsedBonusAttack: false,
                hasAchievedPrivateGoal: false,
                abilityHistory: [],
            });
        }
        return players;
    };
    (0, node_test_1.it)('RoleDistributor assigns mandatory roles and valid turn order', () => {
        const players = createDummyPlayers(6);
        const { players: distributed, turnOrder } = RoleDistributor_1.RoleDistributor.distributeRoles(players, dummySettings);
        node_assert_1.default.strictEqual(distributed.length, 6);
        node_assert_1.default.strictEqual(turnOrder.length, 6);
        const king = distributed.find((p) => p.role?.id === 'king');
        const assassin = distributed.find((p) => p.role?.id === 'assassin');
        const leader = distributed.find((p) => p.role?.id === 'shadow_leader');
        node_assert_1.default.ok(king, 'King role must be assigned');
        node_assert_1.default.ok(assassin, 'Assassin role must be assigned');
        node_assert_1.default.ok(leader, 'Shadow Leader role must be assigned');
    });
    (0, node_test_1.it)('NightResolver absorbs 1 attack per Guard shield', () => {
        const players = createDummyPlayers(5);
        const guardRole = roleData_1.ALL_ROLES.find((r) => r.id === 'guard');
        const assassinRole = roleData_1.ALL_ROLES.find((r) => r.id === 'assassin');
        const citizenRole = roleData_1.ALL_ROLES.find((r) => r.id === 'citizen');
        players[0].role = guardRole;
        players[1].role = assassinRole;
        players[2].role = citizenRole;
        const actions = [
            { playerId: players[0].id, targetIds: [players[2].id] }, // Guard protects citizen
            { playerId: players[1].id, targetIds: [players[2].id] }, // Assassin attacks citizen
        ];
        const resolver = new NightResolver_1.NightResolver(players, actions, 1, players.map((p) => p.id), () => false);
        const outcome = resolver.resolve();
        node_assert_1.default.strictEqual(players[2].isAlive, true, 'Protected player should survive first attack');
        node_assert_1.default.strictEqual(outcome.saved.length, 1, 'Target should be recorded as saved');
    });
    (0, node_test_1.it)('VictoryEngine evaluates Trickster solo win on voting elimination', () => {
        const players = createDummyPlayers(5);
        const tricksterRole = roleData_1.ALL_ROLES.find((r) => r.id === 'trickster');
        players[0].role = tricksterRole;
        players[0].isAlive = false;
        players[0].eliminationCause = shared_1.EliminationCause.votedOut;
        const victoryEngine = new VictoryEngine_1.VictoryEngine();
        const outcome = victoryEngine.evaluate({ players, settings: dummySettings });
        node_assert_1.default.strictEqual(outcome.kind, 'solo');
        node_assert_1.default.strictEqual(outcome.ruleId, 'trickster_voted_out');
    });
    (0, node_test_1.it)('VictoryEngine evaluates KingMustSurvive rule when King dies', () => {
        const players = createDummyPlayers(5);
        const shadowRole = roleData_1.ALL_ROLES.find((r) => r.id === 'assassin');
        const citizenRole = roleData_1.ALL_ROLES.find((r) => r.id === 'citizen');
        players[0].role = citizenRole;
        players[1].role = shadowRole;
        const victoryEngine = new VictoryEngine_1.VictoryEngine();
        const outcome = victoryEngine.evaluate({ players, settings: dummySettings });
        node_assert_1.default.strictEqual(outcome.kind, 'faction');
        node_assert_1.default.strictEqual(outcome.faction, shared_1.Faction.shadow);
        node_assert_1.default.strictEqual(outcome.ruleId, 'king_must_survive');
    });
    (0, node_test_1.it)('BotAI generates valid actions for bot players during Night and Voting', () => {
        const players = createDummyPlayers(5);
        players[1].isBot = true;
        const engine = new GameEngine_1.GameEngine('TEST1', players, dummySettings);
        engine.initGame();
        const botPlayer = engine.players.find((p) => p.isBot);
        if (botPlayer.role) {
            botPlayer.role.nightAbilityKind = shared_1.NightAbilityKind.attack;
        }
        engine.startNight();
        node_assert_1.default.ok(engine.nightActions.length > 0, 'Bot should have automatically submitted a night action');
        engine.startVoting();
        node_assert_1.default.ok(engine.votes.length > 0, 'Bot should have automatically submitted a vote');
    });
});
