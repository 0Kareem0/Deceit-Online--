"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const shared_1 = require("@deceit/shared");
const BotAI_1 = require("../game/BotAI");
const uuid_1 = require("uuid");
class RoomManager {
    static instance;
    rooms = new Map();
    socketToPlayer = new Map();
    constructor() { }
    static getInstance() {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }
    createRoom(hostName, gender = shared_1.Gender.male, socketId) {
        const roomCode = this.generateRoomCode();
        const playerId = `p_${(0, uuid_1.v4)().substring(0, 8)}`;
        const hostPlayer = {
            id: playerId,
            name: hostName,
            gender,
            isHost: true,
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
        };
        const defaultSettings = {
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
        const room = {
            roomCode,
            hostId: playerId,
            players: [hostPlayer],
            status: 'LOBBY',
            settings: defaultSettings,
            socketMap: new Map([[playerId, socketId]]),
            chatHistory: [],
        };
        this.rooms.set(roomCode, room);
        this.socketToPlayer.set(socketId, { roomCode, playerId });
        return { roomCode, playerId };
    }
    broadcastSystemChat(roomCode, io, text, type = 'system', icon) {
        const room = this.rooms.get(roomCode.toUpperCase());
        const msg = {
            id: `msg_${(0, uuid_1.v4)().substring(0, 8)}`,
            text,
            timestamp: Date.now(),
            type,
            icon,
        };
        if (room) {
            room.chatHistory.push(msg);
            if (room.chatHistory.length > 100) {
                room.chatHistory.shift();
            }
        }
        io.to(roomCode).emit('chat:message', msg);
        return msg;
    }
    addPlayerChat(roomCode, io, playerId, text) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room)
            return null;
        const player = room.players.find((p) => p.id === playerId);
        if (!player || !text.trim())
            return null;
        const msg = {
            id: `msg_${(0, uuid_1.v4)().substring(0, 8)}`,
            senderId: player.id,
            senderName: player.name,
            senderGender: player.gender,
            text: text.trim(),
            timestamp: Date.now(),
            type: 'user',
        };
        room.chatHistory.push(msg);
        if (room.chatHistory.length > 100) {
            room.chatHistory.shift();
        }
        io.to(roomCode).emit('chat:message', msg);
        return msg;
    }
    joinRoom(roomCode, playerName, gender = shared_1.Gender.male, socketId, reconnectPlayerId) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room) {
            return { success: false, error: 'الغرفة غير موجودة.' };
        }
        // Handle Reconnection
        if (reconnectPlayerId) {
            const existingPlayer = room.players.find((p) => p.id === reconnectPlayerId);
            if (existingPlayer) {
                existingPlayer.isOnline = true;
                room.socketMap.set(reconnectPlayerId, socketId);
                this.socketToPlayer.set(socketId, { roomCode, playerId: reconnectPlayerId });
                return { success: true, playerId: reconnectPlayerId };
            }
        }
        if (room.status !== 'LOBBY') {
            return { success: false, error: 'اللعبة بدأت بالفعل.' };
        }
        if (room.players.length >= 20) {
            return { success: false, error: 'الغرفة ممتلئة (الحد الأقصى 20 لاعبًا).' };
        }
        if (room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
            return { success: false, error: 'الاسم مستخدم بالفعل في هذه الغرفة.' };
        }
        const playerId = `p_${(0, uuid_1.v4)().substring(0, 8)}`;
        const newPlayer = {
            id: playerId,
            name: playerName,
            gender,
            isHost: false,
            isReady: false,
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
        };
        room.players.push(newPlayer);
        room.socketMap.set(playerId, socketId);
        this.socketToPlayer.set(socketId, { roomCode, playerId });
        return { success: true, playerId };
    }
    resetRoomToLobby(roomCode, io) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room)
            return false;
        room.status = 'LOBBY';
        room.gameEngine = undefined;
        for (const p of room.players) {
            p.isAlive = true;
            p.eliminationCause = shared_1.EliminationCause.none;
            p.poisonedCount = 0;
            p.isSilenced = false;
            p.isAbilityBlocked = false;
            p.nightCooldownEnd = 0;
            p.dayCooldownEnd = 0;
            p.abilityUsesCount = 0;
            p.successfulAbilityUsesCount = 0;
            p.hasUsedBonusAttack = false;
            p.hasAchievedPrivateGoal = false;
            p.abilityHistory = [];
            p.role = undefined;
            p.isReady = p.isHost || p.isBot ? true : false;
        }
        const roomState = this.getRoomState(room.roomCode);
        if (roomState) {
            io.to(room.roomCode).emit('room:updated', roomState);
        }
        // Clear public and private state for all connected players
        io.to(room.roomCode).emit('game:state', null);
        this.broadcastSystemChat(room.roomCode, io, 'تمت إعادة فتح الغرفة للتحضير لجولة جديدة! 🔄', 'system', '🔄');
        return true;
    }
    getRoom(roomCode) {
        return this.rooms.get(roomCode.toUpperCase());
    }
    getPlayerBySocket(socketId) {
        const mapping = this.socketToPlayer.get(socketId);
        if (!mapping)
            return {};
        const room = this.rooms.get(mapping.roomCode);
        const player = room?.players.find((p) => p.id === mapping.playerId);
        return { room, player };
    }
    handleDisconnect(socketId) {
        const { room, player } = this.getPlayerBySocket(socketId);
        if (room && player) {
            player.isOnline = false;
            this.socketToPlayer.delete(socketId);
            return { roomCode: room.roomCode, player };
        }
        return {};
    }
    addBot(roomCode) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room)
            return { success: false, error: 'الغرفة غير موجودة.' };
        if (room.status !== 'LOBBY')
            return { success: false, error: 'اللعبة بدأت بالفعل.' };
        if (room.players.length >= 20)
            return { success: false, error: 'الغرفة ممتلئة.' };
        const botCount = room.players.filter((p) => p.isBot).length;
        const botTemplate = BotAI_1.BOT_NAMES[botCount % BotAI_1.BOT_NAMES.length];
        const botId = `bot_${(0, uuid_1.v4)().substring(0, 8)}`;
        const botPlayer = {
            id: botId,
            name: botTemplate.name,
            gender: botTemplate.gender,
            isHost: false,
            isReady: true,
            isOnline: true,
            isAlive: true,
            isBot: true,
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
        };
        room.players.push(botPlayer);
        return { success: true };
    }
    removeBot(roomCode, botId) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room)
            return { success: false, error: 'الغرفة غير موجودة.' };
        if (room.status !== 'LOBBY')
            return { success: false, error: 'اللعبة بدأت بالفعل.' };
        let targetIdx = -1;
        if (botId) {
            targetIdx = room.players.findIndex((p) => p.id === botId && p.isBot);
        }
        else {
            // Remove last bot
            for (let i = room.players.length - 1; i >= 0; i--) {
                if (room.players[i].isBot) {
                    targetIdx = i;
                    break;
                }
            }
        }
        if (targetIdx < 0)
            return { success: false, error: 'لا يوجد بوتات لإزالتها.' };
        room.players.splice(targetIdx, 1);
        return { success: true };
    }
    getRoomState(roomCode) {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room)
            return undefined;
        return {
            roomCode: room.roomCode,
            hostId: room.hostId,
            players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                gender: p.gender,
                isHost: p.isHost,
                isReady: p.isReady,
                isOnline: p.isOnline,
                isAlive: p.isAlive,
                isBot: p.isBot,
            })),
            status: room.status,
            settings: room.settings,
        };
    }
    tickerStarted = false;
    startPhaseTicker(io) {
        if (this.tickerStarted)
            return;
        this.tickerStarted = true;
        setInterval(() => {
            const now = Date.now();
            for (const room of this.rooms.values()) {
                if (room.status === 'IN_GAME' && room.gameEngine) {
                    const engine = room.gameEngine;
                    if (engine.phaseEndsAt && now >= engine.phaseEndsAt) {
                        this.autoAdvancePhase(room, io);
                    }
                }
            }
        }, 1000);
    }
    autoAdvancePhase(room, io) {
        const engine = room.gameEngine;
        if (!engine)
            return;
        switch (engine.status) {
            case shared_1.GameStatus.inRoleReveal:
            case shared_1.GameStatus.inMatchIntro:
                engine.startNight();
                break;
            case shared_1.GameStatus.inNight:
                engine.resolveNight();
                break;
            case shared_1.GameStatus.inMorning:
                engine.startDiscussion();
                break;
            case shared_1.GameStatus.inDiscussion:
                engine.startVoting();
                break;
            case shared_1.GameStatus.inVoting:
                if (!engine.votingClosed) {
                    const living = engine.players.filter((p) => p.isAlive);
                    for (const p of living) {
                        if (!engine.votes.some((v) => v.voterId === p.id)) {
                            engine.votes.push({ voterId: p.id, targetId: 'skip' });
                        }
                    }
                    engine.closeVoting();
                }
                break;
            case shared_1.GameStatus.inDayPowers:
                engine.applyVerdict();
                break;
            case shared_1.GameStatus.inElimination:
                if (engine.victory.kind === shared_1.VictoryKind.undecided) {
                    engine.startNight();
                }
                break;
            default:
                break;
        }
        // Broadcast updated states
        io.to(room.roomCode).emit('game:state', engine.getPublicGameState());
        for (const p of room.players) {
            const socketId = room.socketMap.get(p.id);
            if (socketId) {
                io.to(socketId).emit('game:intel', engine.getPrivatePlayerState(p.id));
            }
        }
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like O, 0, 1, I
        let code = '';
        do {
            code = '';
            for (let i = 0; i < 5; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(code));
        return code;
    }
}
exports.RoomManager = RoomManager;
