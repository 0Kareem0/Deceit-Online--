import { MatchSettings, PublicGameState, PrivatePlayerState, NightAction, Vote } from './game.js';
import { PlayerPublic } from './player.js';
import { ChatMessage } from './chat.js';
export interface RoomState {
    roomCode: string;
    hostId: string;
    players: PlayerPublic[];
    status: 'LOBBY' | 'IN_GAME' | 'FINISHED';
    settings: MatchSettings;
}
export interface ClientToServerEvents {
    'room:create': (payload: {
        hostName: string;
        gender?: 'male' | 'female';
    }, callback: (response: {
        success: boolean;
        roomCode?: string;
        playerId?: string;
        error?: string;
    }) => void) => void;
    'room:join': (payload: {
        roomCode: string;
        playerName: string;
        gender?: 'male' | 'female';
        reconnectPlayerId?: string;
    }, callback: (response: {
        success: boolean;
        roomCode?: string;
        playerId?: string;
        error?: string;
    }) => void) => void;
    'room:leave': () => void;
    'player:ready': (payload: {
        ready: boolean;
    }) => void;
    'room:add_bot': (callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    'room:remove_bot': (payload?: {
        botId?: string;
    }, callback?: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    'game:start': (payload: {
        settings: MatchSettings;
    }) => void;
    'game:night_action': (payload: NightAction) => void;
    'game:vote': (payload: Vote) => void;
    'game:day_power': (payload: {
        abilityType: string;
    }) => void;
    'game:proceed_phase': () => void;
    'game:play_again': () => void;
    'chat:send': (payload: {
        message: string;
    }) => void;
}
export interface ServerToClientEvents {
    'room:updated': (roomState: RoomState) => void;
    'game:state': (publicState: PublicGameState) => void;
    'game:intel': (privateState: PrivatePlayerState) => void;
    'game:phase_change': (payload: {
        status: string;
        narration?: string;
    }) => void;
    'game:error': (payload: {
        code: string;
        message: string;
    }) => void;
    'chat:message': (message: ChatMessage) => void;
    'chat:history': (messages: ChatMessage[]) => void;
}
