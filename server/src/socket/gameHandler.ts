import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager';
import { GameStatus, VictoryKind } from '@deceit/shared';

export function registerGameHandlers(io: Server, socket: Socket) {
  const manager = RoomManager.getInstance();

  const broadcastState = (roomCode: string) => {
    const room = manager.getRoom(roomCode);
    if (!room || !room.gameEngine) return;

    const publicState = room.gameEngine.getPublicGameState();
    io.to(roomCode).emit('game:state', publicState);

    for (const p of room.players) {
      const socketId = room.socketMap.get(p.id);
      if (socketId) {
        io.to(socketId).emit('game:intel', room.gameEngine.getPrivatePlayerState(p.id));
      }
    }
  };

  // 0. Player Chat Sending
  socket.on('chat:send', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !player || !payload?.message) return;
    manager.addPlayerChat(room.roomCode, io, player.id, payload.message);
  });

  // 1. Submit Night Action
  socket.on('game:night_action', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !room.gameEngine || !player) return;

    const result = room.gameEngine.submitNightAction({
      playerId: player.id,
      targetIds: payload.targetIds || [],
    });

    if (!result.success) {
      socket.emit('game:error', { code: 'INVALID_ACTION', message: result.error || 'حركة ليلية غير صالحة.' });
      return;
    }

    manager.broadcastSystemChat(room.roomCode, io, `أتم ${player.name} اختياره وحركته الليلية 🌙`, 'action', '🌙');
    broadcastState(room.roomCode);
  });

  // 2. Submit Vote
  socket.on('game:vote', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !room.gameEngine || !player) return;

    room.gameEngine.submitVote({
      voterId: player.id,
      targetId: payload.targetId,
    });

    manager.broadcastSystemChat(room.roomCode, io, `أودع ${player.name} صوته في صندوق الاقتراع 🗳️`, 'action', '🗳️');
    broadcastState(room.roomCode);
  });

  // 3. Trigger Day Power (Judge Veto)
  socket.on('game:day_power', (payload) => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !room.gameEngine || !player) return;

    if (payload?.abilityType === 'veto') {
      const success = room.gameEngine.vetoJudgeVote(player.id);
      if (!success) {
        return socket.emit('game:error', { code: 'INVALID_ACTION', message: 'تعذر تفعيل اعتراض القاضي.' });
      }
      manager.broadcastSystemChat(room.roomCode, io, `تدخل القاضي ${player.name} وألغى نتيجة التصويت بنجاح! ⚖️`, 'elimination', '⚖️');
      broadcastState(room.roomCode);
    }
  });

  // 4. Phase Control Trigger (Host or Auto)
  socket.on('game:proceed_phase', () => {
    const { room, player } = manager.getPlayerBySocket(socket.id);
    if (!room || !room.gameEngine || !player) return;

    const engine = room.gameEngine;

    switch (engine.status) {
      case GameStatus.inRoleReveal:
      case GameStatus.inMatchIntro:
        engine.startNight();
        manager.broadcastSystemChat(room.roomCode, io, `أسدل الليل ستائره على المملكة (الليلة ${engine.currentNight}) 🌑`, 'phase', '🌑');
        break;
      case GameStatus.inNight:
        engine.resolveNight();
        manager.broadcastSystemChat(room.roomCode, io, `انجلت الظلمات وأشرقت الشمس فوق المملكة 🌅`, 'phase', '🌅');
        break;
      case GameStatus.inMorning:
        engine.startDiscussion();
        manager.broadcastSystemChat(room.roomCode, io, `افتتح مجلس الشورى والنقاش للبحث عن الخونة 💬`, 'phase', '💬');
        break;
      case GameStatus.inDiscussion:
        engine.startVoting();
        manager.broadcastSystemChat(room.roomCode, io, `بدأت جولة التصويت السري لاقتراع الاستبعاد 🗳️`, 'phase', '🗳️');
        break;
      case GameStatus.inVoting:
        if (!engine.votingClosed) {
          engine.closeVoting();
          manager.broadcastSystemChat(room.roomCode, io, `تم إغلاق صناديق الاقتراع وفرز الأصوات ⚖️`, 'phase', '⚖️');
        }
        break;
      case GameStatus.inDayPowers:
        engine.applyVerdict();
        if (engine.eliminatedPlayer) {
          manager.broadcastSystemChat(room.roomCode, io, `تم تنفيذ حكم الاستبعاد النهائي بحق ${engine.eliminatedPlayer.name} ⚔️`, 'elimination', '⚔️');
        } else {
          manager.broadcastSystemChat(room.roomCode, io, `انتهى اليوم دون استبعاد أي لاعب 🛡️`, 'phase', '🛡️');
        }
        break;
      case GameStatus.inElimination:
        if (engine.victory.kind === VictoryKind.undecided) {
          engine.startNight();
          manager.broadcastSystemChat(room.roomCode, io, `حلّ الليل مجدداً فوق أسوار القلعة (الليلة ${engine.currentNight}) 🌑`, 'phase', '🌑');
        } else {
          manager.broadcastSystemChat(room.roomCode, io, `انتهت المعركة وانجلت حقيقة المباراة! 🏆`, 'phase', '🏆');
        }
        break;
      default:
        break;
    }

    broadcastState(room.roomCode);
  });

  // 5. Play Again (Reset room to lobby)
  socket.on('game:play_again', () => {
    const { room } = manager.getPlayerBySocket(socket.id);
    if (!room) return;
    manager.resetRoomToLobby(room.roomCode, io);
  });
}
