import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { GameEngine } from '../game/GameEngine';
import { Gender } from '@deceit/shared';

export function registerRoomHandlers(io: Server, socket: Socket) {
  const manager = RoomManager.getInstance();

  // 1. Create Room
  socket.on('room:create', (payload, callback) => {
    try {
      const { hostName, gender } = payload || {};
      if (!hostName || hostName.trim().length < 2) {
        return callback({ success: false, error: 'يرجى إدخال اسم صالح (حرفين على الأقل).' });
      }

      const { roomCode, playerId } = manager.createRoom(
        hostName.trim(),
        gender === 'female' ? Gender.female : Gender.male,
        socket.id
      );

      socket.join(roomCode);
      const roomState = manager.getRoomState(roomCode);

      callback({ success: true, roomCode, playerId });
      if (roomState) {
        io.to(roomCode).emit('room:updated', roomState);
      }
      manager.broadcastSystemChat(roomCode, io, `تم إنشاء الغرفة بواسطة ${hostName.trim()} 👑`, 'system', '👑');
      socket.emit('chat:history', manager.getRoom(roomCode)?.chatHistory || []);
    } catch (e: any) {
      callback({ success: false, error: e.message || 'فشل في إنشاء الغرفة.' });
    }
  });

  // 2. Join Room
  socket.on('room:join', (payload, callback) => {
    try {
      const { roomCode, playerName, gender, reconnectPlayerId } = payload || {};
      if (!roomCode || !playerName) {
        return callback({ success: false, error: 'رمز الغرفة والاسم مطلوبان.' });
      }

      const result = manager.joinRoom(
        roomCode.trim().toUpperCase(),
        playerName.trim(),
        gender === 'female' ? Gender.female : Gender.male,
        socket.id,
        reconnectPlayerId
      );

      if (!result.success || !result.playerId) {
        return callback({ success: false, error: result.error });
      }

      const cleanCode = roomCode.trim().toUpperCase();
      socket.join(cleanCode);
      const roomState = manager.getRoomState(cleanCode);

      callback({ success: true, roomCode: cleanCode, playerId: result.playerId });
      if (roomState) {
        io.to(cleanCode).emit('room:updated', roomState);
      }

      const room = manager.getRoom(cleanCode);
      if (room) {
        socket.emit('chat:history', room.chatHistory);
        if (!reconnectPlayerId) {
          manager.broadcastSystemChat(cleanCode, io, `انضم ${playerName.trim()} إلى مجلس الغرفة 👋`, 'system', '👋');
        }
        if (room.gameEngine) {
          socket.emit('game:state', room.gameEngine.getPublicGameState());
          socket.emit('game:intel', room.gameEngine.getPrivatePlayerState(result.playerId));
        }
      }
    } catch (e: any) {
      callback({ success: false, error: e.message || 'فشل في الانضمام للغرفة.' });
    }
  });

  // 3. Player Ready Toggle
  socket.on('player:ready', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (room && player) {
      player.isReady = payload?.ready ?? !player.isReady;
      const roomState = manager.getRoomState(room.roomCode);
      if (roomState) {
        io.to(room.roomCode).emit('room:updated', roomState);
      }
    }
  });

  // 3.5. Add Bot (Host only)
  socket.on('room:add_bot', (callback) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !player || !player.isHost) {
      return callback && callback({ success: false, error: 'هذا الإجراء متاح فقط لمضيف الغرفة.' });
    }

    const result = manager.addBot(room.roomCode);
    if (result.success) {
      const roomState = manager.getRoomState(room.roomCode);
      if (roomState) {
        io.to(room.roomCode).emit('room:updated', roomState);
      }
      const lastBot = room.players.filter((p) => p.isBot).slice(-1)[0];
      if (lastBot) {
        manager.broadcastSystemChat(room.roomCode, io, `انضم البوت الذكي ${lastBot.name} إلى الطاولة 🤖`, 'system', '🤖');
      }
    }
    if (callback) callback(result);
  });

  // 3.6. Remove Bot (Host only)
  socket.on('room:remove_bot', (payload, callback) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !player || !player.isHost) {
      return callback && callback({ success: false, error: 'هذا الإجراء متاح فقط لمضيف الغرفة.' });
    }

    const result = manager.removeBot(room.roomCode, payload?.botId);
    if (result.success) {
      const roomState = manager.getRoomState(room.roomCode);
      if (roomState) {
        io.to(room.roomCode).emit('room:updated', roomState);
      }
    }
    if (callback) callback(result);
  });

  // 4. Game Start (Host only)
  socket.on('game:start', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !player || !player.isHost) {
      return socket.emit('game:error', { code: 'NOT_HOST', message: 'هذا الإجراء متاح فقط لمضيف الغرفة.' });
    }

    if (room.players.length < 5) {
      return socket.emit('game:error', { code: 'NOT_ENOUGH_PLAYERS', message: 'يلزم 5 لاعبين على الأقل لبدء المباراة.' });
    }

    if (payload?.settings) {
      room.settings = { ...room.settings, ...payload.settings };
    }

    room.status = 'IN_GAME';
    const engine = new GameEngine(room.roomCode, room.players, room.settings);
    engine.initGame();
    room.gameEngine = engine;

    const roomState = manager.getRoomState(room.roomCode);
    if (roomState) {
      io.to(room.roomCode).emit('room:updated', roomState);
    }

    manager.broadcastSystemChat(
      room.roomCode,
      io,
      'انطلقت المعركة رسميًا! تم توزيع الأدوار السرية بين حراس المملكة وخلايا الظلال ⚔️',
      'phase',
      '⚔️'
    );

    // Broadcast Public & Private States
    io.to(room.roomCode).emit('game:state', engine.getPublicGameState());
    for (const p of room.players) {
      const socketId = room.socketMap.get(p.id);
      if (socketId) {
        io.to(socketId).emit('game:intel', engine.getPrivatePlayerState(p.id));
      }
    }
  });

  // 5. Disconnect handling
  socket.on('disconnect', () => {
    const { roomCode } = manager.handleDisconnect(socket.id);
    if (roomCode) {
      const roomState = manager.getRoomState(roomCode);
      if (roomState) {
        io.to(roomCode).emit('room:updated', roomState);
      }
    }
  });
}
