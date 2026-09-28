"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMatchResult = saveMatchResult;
const MatchHistory_1 = require("./models/MatchHistory");
const User_1 = require("./models/User");
const shared_1 = require("@deceit/shared");
async function saveMatchResult(game) {
    try {
        if (game.victory.kind === 'undecided')
            return;
        const winningFaction = game.victory.faction || shared_1.Faction.kingdom;
        const matchPlayers = game.players.map((p) => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            roleId: p.role?.id || 'citizen',
            roleName: p.role?.name || 'مواطن',
            faction: p.role?.faction || shared_1.Faction.kingdom,
            isAlive: p.isAlive,
            isBot: p.isBot || false,
        }));
        const historyDoc = new MatchHistory_1.MatchHistoryModel({
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
                await User_1.UserModel.findOneAndUpdate({ username: p.name.toLowerCase() }, {
                    $setOnInsert: { username: p.name.toLowerCase(), name: p.name, gender: p.gender || 'male' },
                    $inc: {
                        'stats.gamesPlayed': 1,
                        ...(isWin && winningFaction === shared_1.Faction.kingdom ? { 'stats.kingdomWins': 1 } : {}),
                        ...(isWin && winningFaction === shared_1.Faction.shadow ? { 'stats.shadowWins': 1 } : {}),
                        ...(isWin && winningFaction === shared_1.Faction.neutral ? { 'stats.neutralWins': 1 } : {}),
                    },
                }, { upsert: true, new: true }).catch(() => { });
            }
        }
    }
    catch (err) {
        console.error('[DB] Failed to save match history:', err);
    }
}
