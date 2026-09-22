import { Player, RoomState, MatchSettings, Gender, EliminationCause, GameStatus, VictoryKind, ChatMessage, ChatMessageType } from '@deceit/shared';
import { GameEngine } from '../game/GameEngine';
import { BOT_NAMES } from '../game/BotAI';
import { v4 as uuidv4 } from 'uuid';

export interface ActiveRoom {
  roomCode: string;
  hostId: string;
  players: Player[];
  status: 'LOBBY' | 'IN_GAME' | 'FINISHED';
  settings: MatchSettings;
  gameEngine?: GameEngine;
  socketMap: Map<string, string>; // playerId -> socketId
  chatHistory: ChatMessage[];
}

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, ActiveRoom> = new Map();
  private socketToPlayer: Map<string, { roomCode: string; playerId: string }> = new Map();

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public createRoom(hostName: string, gender: Gender = Gender.male, socketId: string): { roomCode: string; playerId: string } {
    const roomCode = this.generateRoomCode();
    const playerId = `p_${uuidv4().substring(0, 8)}`;

    const hostPlayer: Player = {
      id: playerId,
      name: hostName,
      gender,
      isHost: true,
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
    };

    const defaultSettings: MatchSettings = {
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

    const room: ActiveRoom = {
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

  public broadcastSystemChat(
    roomCode: string,
    io: any,
    text: string,
    type: ChatMessageType = 'system',
    icon?: string
  ): ChatMessage {
    const room = this.rooms.get(roomCode.toUpperCase());
    const msg: ChatMessage = {
      id: `msg_${uuidv4().substring(0, 8)}`,
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

  public addPlayerChat(roomCode: string, io: any, playerId: string, text: string): ChatMessage | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !text.trim()) return null;

    const msg: ChatMessage = {
      id: `msg_${uuidv4().substring(0, 8)}`,
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

  public joinRoom(
    roomCode: string,
    playerName: string,
    gender: Gender = Gender.male,
    socketId: string,
    reconnectPlayerId?: string
  ): { success: boolean; playerId?: string; error?: string } {
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

    const playerId = `p_${uuidv4().substring(0, 8)}`;
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      gender,
      isHost: false,
      isReady: false,
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
    };

    room.players.push(newPlayer);
    room.socketMap.set(playerId, socketId);
    this.socketToPlayer.set(socketId, { roomCode, playerId });

    return { success: true, playerId };
  }

  public resetRoomToLobby(roomCode: string, io: any): boolean {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return false;

    room.status = 'LOBBY';
    room.gameEngine = undefined;

    for (const p of room.players) {
      p.isAlive = true;
      p.eliminationCause = EliminationCause.none;
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
    io.to(room.roomCode).emit('game:state', null as any);

    this.broadcastSystemChat(room.roomCode, io, 'تمت إعادة فتح الغرفة للتحضير لجولة جديدة! 🔄', 'system', '🔄');

    return true;
  }

  public getRoom(roomCode: string): ActiveRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public getPlayerBySocket(socketId: string): { room?: ActiveRoom; player?: Player } {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return {};
    const room = this.rooms.get(mapping.roomCode);
    const player = room?.players.find((p) => p.id === mapping.playerId);
    return { room, player };
  }

  public handleDisconnect(socketId: string): { roomCode?: string; player?: Player } {
    const { room, player } = this.getPlayerBySocket(socketId);
    if (room && player) {
      player.isOnline = false;
      this.socketToPlayer.delete(socketId);
      return { roomCode: room.roomCode, player };
    }
    return {};
  }

  public addBot(roomCode: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, error: 'الغرفة غير موجودة.' };
    if (room.status !== 'LOBBY') return { success: false, error: 'اللعبة بدأت بالفعل.' };
    if (room.players.length >= 20) return { success: false, error: 'الغرفة ممتلئة.' };

    const botCount = room.players.filter((p) => p.isBot).length;
    const botTemplate = BOT_NAMES[botCount % BOT_NAMES.length];
    const botId = `bot_${uuidv4().substring(0, 8)}`;

    const botPlayer: Player = {
      id: botId,
      name: botTemplate.name,
      gender: botTemplate.gender,
      isHost: false,
      isReady: true,
      isOnline: true,
      isAlive: true,
      isBot: true,
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
    };

    room.players.push(botPlayer);
    return { success: true };
  }

  public removeBot(roomCode: string, botId?: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { success: false, error: 'الغرفة غير موجودة.' };
    if (room.status !== 'LOBBY') return { success: false, error: 'اللعبة بدأت بالفعل.' };

    let targetIdx = -1;
    if (botId) {
      targetIdx = room.players.findIndex((p) => p.id === botId && p.isBot);
    } else {
      // Remove last bot
      for (let i = room.players.length - 1; i >= 0; i--) {
        if (room.players[i].isBot) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx < 0) return { success: false, error: 'لا يوجد بوتات لإزالتها.' };

    room.players.splice(targetIdx, 1);
    return { success: true };
  }

  public getRoomState(roomCode: string): RoomState | undefined {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return undefined;

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

  private tickerStarted = false;

  public startPhaseTicker(io: any): void {
    if (this.tickerStarted) return;
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

  public autoAdvancePhase(room: ActiveRoom, io: any): void {
    const engine = room.gameEngine;
    if (!engine) return;

    switch (engine.status) {
      case GameStatus.inRoleReveal:
      case GameStatus.inMatchIntro:
        engine.startNight();
        break;
      case GameStatus.inNight:
        engine.resolveNight();
        break;
      case GameStatus.inMorning:
        engine.startDiscussion();
        break;
      case GameStatus.inDiscussion:
        engine.startVoting();
        break;
      case GameStatus.inVoting:
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
      case GameStatus.inDayPowers:
        engine.applyVerdict();
        break;
      case GameStatus.inElimination:
        if (engine.victory.kind === VictoryKind.undecided) {
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

  private generateRoomCode(): string {
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
