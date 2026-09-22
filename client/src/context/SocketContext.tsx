import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  RoomState,
  PublicGameState,
  PrivatePlayerState,
  MatchSettings,
  NightAction,
  Vote,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@deceit/shared';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  roomCode: string | null;
  playerId: string | null;
  roomState: RoomState | null;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
  messages: ChatMessage[];
  error: string | null;
  clearError: () => void;
  createRoom: (hostName: string, gender?: 'male' | 'female') => Promise<boolean>;
  joinRoom: (code: string, playerName: string, gender?: 'male' | 'female') => Promise<boolean>;
  toggleReady: (ready: boolean) => void;
  addBot: () => void;
  removeBot: (botId?: string) => void;
  startGame: (settings?: MatchSettings) => void;
  sendNightAction: (action: NightAction) => void;
  sendVote: (vote: Vote) => void;
  sendDayPower: (abilityType: string) => void;
  proceedPhase: () => void;
  playAgain: () => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SERVER_URL = 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem('deceit_room_code'));
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem('deceit_player_id'));
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to backend');

      // Auto-reconnect if session exists
      const savedCode = localStorage.getItem('deceit_room_code');
      const savedPlayerId = localStorage.getItem('deceit_player_id');
      const savedName = localStorage.getItem('deceit_player_name');

      if (savedCode && savedPlayerId && savedName) {
        newSocket.emit(
          'room:join',
          { roomCode: savedCode, playerName: savedName, reconnectPlayerId: savedPlayerId },
          (res) => {
            if (res.success && res.roomCode && res.playerId) {
              setRoomCode(res.roomCode);
              setPlayerId(res.playerId);
            } else {
              localStorage.removeItem('deceit_room_code');
              localStorage.removeItem('deceit_player_id');
            }
          }
        );
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('room:updated', (state) => {
      setRoomState(state);
    });

    newSocket.on('game:state', (state) => {
      setPublicState(state);
    });

    newSocket.on('game:intel', (intel) => {
      setPrivateState(intel);
    });

    newSocket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on('chat:history', (history) => {
      setMessages(history);
    });

    newSocket.on('game:error', (err) => {
      setError(err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const clearError = () => setError(null);

  const createRoom = (hostName: string, gender: 'male' | 'female' = 'male'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);

      socket.emit('room:create', { hostName, gender }, (res) => {
        if (res.success && res.roomCode && res.playerId) {
          setRoomCode(res.roomCode);
          setPlayerId(res.playerId);
          localStorage.setItem('deceit_room_code', res.roomCode);
          localStorage.setItem('deceit_player_id', res.playerId);
          localStorage.setItem('deceit_player_name', hostName);
          resolve(true);
        } else {
          setError(res.error || 'فشل في إنشاء الغرفة');
          resolve(false);
        }
      });
    });
  };

  const joinRoom = (code: string, playerName: string, gender: 'male' | 'female' = 'male'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);

      socket.emit('room:join', { roomCode: code, playerName, gender }, (res) => {
        if (res.success && res.roomCode && res.playerId) {
          setRoomCode(res.roomCode);
          setPlayerId(res.playerId);
          localStorage.setItem('deceit_room_code', res.roomCode);
          localStorage.setItem('deceit_player_id', res.playerId);
          localStorage.setItem('deceit_player_name', playerName);
          resolve(true);
        } else {
          setError(res.error || 'فشل في الانضمام للغرفة');
          resolve(false);
        }
      });
    });
  };

  const toggleReady = (ready: boolean) => {
    socket?.emit('player:ready', { ready });
  };

  const addBot = () => {
    socket?.emit('room:add_bot', (res) => {
      if (!res.success && res.error) setError(res.error);
    });
  };

  const removeBot = (botId?: string) => {
    socket?.emit('room:remove_bot', { botId }, (res) => {
      if (!res.success && res.error) setError(res.error);
    });
  };

  const startGame = (settings?: MatchSettings) => {
    if (roomState?.settings) {
      socket?.emit('game:start', { settings: settings || roomState.settings });
    }
  };

  const sendNightAction = (action: NightAction) => {
    socket?.emit('game:night_action', action);
  };

  const sendVote = (vote: Vote) => {
    socket?.emit('game:vote', vote);
  };

  const sendDayPower = (abilityType: string) => {
    socket?.emit('game:day_power', { abilityType });
  };

  const proceedPhase = () => {
    socket?.emit('game:proceed_phase');
  };

  const playAgain = () => {
    socket?.emit('game:play_again');
  };

  const leaveRoom = () => {
    socket?.emit('room:leave');
    localStorage.removeItem('deceit_room_code');
    localStorage.removeItem('deceit_player_id');
    localStorage.removeItem('deceit_player_name');
    setRoomCode(null);
    setPlayerId(null);
    setRoomState(null);
    setPublicState(null);
    setPrivateState(null);
    setMessages([]);
  };

  const sendMessage = (message: string) => {
    if (message.trim()) {
      socket?.emit('chat:send', { message: message.trim() });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        roomCode,
        playerId,
        roomState,
        publicState,
        privateState,
        messages,
        error,
        clearError,
        createRoom,
        joinRoom,
        toggleReady,
        addBot,
        removeBot,
        startGame,
        sendNightAction,
        sendVote,
        sendDayPower,
        proceedPhase,
        playAgain,
        leaveRoom,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
