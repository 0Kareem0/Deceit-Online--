import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../GameEngine';
import { RoleDistributor } from '../RoleDistributor';
import { VictoryEngine } from '../VictoryEngine';
import { NightResolver } from '../NightResolver';
import { Player, Faction, GameStatus, EliminationCause, NightAbilityKind } from '@deceit/shared';
import { ALL_ROLES } from '../roleData';

describe('GameEngine & Rules Unit Tests', () => {
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

  const createDummyPlayers = (count: number): Player[] => {
    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      players.push({
        id: `p_${i + 1}`,
        name: `Player_${i + 1}`,
        gender: 'male' as any,
        isHost: i === 0,
        isReady: true,
        isOnline: true,
        isAlive: true,
        eliminationCause: EliminationCause.none,
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

  it('RoleDistributor assigns mandatory roles and valid turn order', () => {
    const players = createDummyPlayers(6);
    const { players: distributed, turnOrder } = RoleDistributor.distributeRoles(players, dummySettings);

    assert.strictEqual(distributed.length, 6);
    assert.strictEqual(turnOrder.length, 6);

    const king = distributed.find((p) => p.role?.id === 'king');
    const assassin = distributed.find((p) => p.role?.id === 'assassin');
    const leader = distributed.find((p) => p.role?.id === 'shadow_leader');

    assert.ok(king, 'King role must be assigned');
    assert.ok(assassin, 'Assassin role must be assigned');
    assert.ok(leader, 'Shadow Leader role must be assigned');
  });

  it('NightResolver absorbs 1 attack per Guard shield', () => {
    const players = createDummyPlayers(5);
    const guardRole = ALL_ROLES.find((r) => r.id === 'guard')!;
    const assassinRole = ALL_ROLES.find((r) => r.id === 'assassin')!;
    const citizenRole = ALL_ROLES.find((r) => r.id === 'citizen')!;

    players[0].role = guardRole;
    players[1].role = assassinRole;
    players[2].role = citizenRole;

    const actions = [
      { playerId: players[0].id, targetIds: [players[2].id] }, // Guard protects citizen
      { playerId: players[1].id, targetIds: [players[2].id] }, // Assassin attacks citizen
    ];

    const resolver = new NightResolver(players, actions, 1, players.map((p) => p.id), () => false);
    const outcome = resolver.resolve();

    assert.strictEqual(players[2].isAlive, true, 'Protected player should survive first attack');
    assert.strictEqual(outcome.saved.length, 1, 'Target should be recorded as saved');
  });

  it('VictoryEngine evaluates Trickster solo win on voting elimination', () => {
    const players = createDummyPlayers(5);
    const tricksterRole = ALL_ROLES.find((r) => r.id === 'trickster')!;
    players[0].role = tricksterRole;
    players[0].isAlive = false;
    players[0].eliminationCause = EliminationCause.votedOut;

    const victoryEngine = new VictoryEngine();
    const outcome = victoryEngine.evaluate({ players, settings: dummySettings });

    assert.strictEqual(outcome.kind, 'solo');
    assert.strictEqual(outcome.ruleId, 'trickster_voted_out');
  });

  it('VictoryEngine evaluates KingMustSurvive rule when King dies', () => {
    const players = createDummyPlayers(5);
    const shadowRole = ALL_ROLES.find((r) => r.id === 'assassin')!;
    const citizenRole = ALL_ROLES.find((r) => r.id === 'citizen')!;

    players[0].role = citizenRole;
    players[1].role = shadowRole;

    const victoryEngine = new VictoryEngine();
    const outcome = victoryEngine.evaluate({ players, settings: dummySettings });

    assert.strictEqual(outcome.kind, 'faction');
    assert.strictEqual(outcome.faction, Faction.shadow);
    assert.strictEqual(outcome.ruleId, 'king_must_survive');
  });

  it('BotAI generates valid actions for bot players during Night and Voting', () => {
    const players = createDummyPlayers(5);
    players[1].isBot = true;

    const engine = new GameEngine('TEST1', players, dummySettings);
    engine.initGame();

    const botPlayer = engine.players.find((p) => p.isBot)!;
    if (botPlayer.role) {
      botPlayer.role.nightAbilityKind = NightAbilityKind.attack;
    }

    engine.startNight();

    assert.ok(engine.nightActions.length > 0, 'Bot should have automatically submitted a night action');

    engine.startVoting();
    assert.ok(engine.votes.length > 0, 'Bot should have automatically submitted a vote');
  });
});
