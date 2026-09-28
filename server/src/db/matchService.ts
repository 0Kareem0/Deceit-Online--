import { MatchHistoryModel, IMatchPlayer } from './models/MatchHistory';
import { UserModel } from './models/User';
import { GameEngine } from '../game/GameEngine';
import { Faction } from '@deceit/shared';

export async function saveMatchResult(game: GameEngine): Promise<void> {
  try {
    if (game.victory.kind === 'undecided') return;

    const winningFaction = (game.victory.faction as Faction) || Faction.kingdom;

    const matchPlayers: IMatchPlayer[] = game.players.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      roleId: p.role?.id || 'citizen',
      roleName: p.role?.name || 'مواطن',
      faction: p.role?.faction || Faction.kingdom,
      isAlive: p.isAlive,
      isBot: p.isBot || false,
    }));

    const historyDoc = new MatchHistoryModel({
      roomId: game.roomCode,
      winningFaction,
      winnerMessage: game.victory.reason || 'انتهاء المباراة',
      players: matchPlayers,
      totalRounds: game.currentNight,
      durationSeconds: Math.floor((Date.now() - (game.phaseEndsAt || Date.now())) / 1000) || 120,
    });

    await historyDoc.save();
    console.log(`[DB] Match history saved for room ${game.roomCode}. Winner: ${winningFaction}`);

    // Update stats for registered users (non-bots)
    for (const p of game.players) {
      if (!p.isBot && p.name) {
        const isWin = p.role?.faction === winningFaction;
        await UserModel.findOneAndUpdate(
          { username: p.name.toLowerCase() },
          {
            $setOnInsert: { username: p.name.toLowerCase(), name: p.name, gender: p.gender || 'male' },
            $inc: {
              'stats.gamesPlayed': 1,
              ...(isWin && winningFaction === Faction.kingdom ? { 'stats.kingdomWins': 1 } : {}),
              ...(isWin && winningFaction === Faction.shadow ? { 'stats.shadowWins': 1 } : {}),
              ...(isWin && winningFaction === Faction.neutral ? { 'stats.neutralWins': 1 } : {}),
            },
          },
          { upsert: true, new: true }
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[DB] Failed to save match history:', err);
  }
}
