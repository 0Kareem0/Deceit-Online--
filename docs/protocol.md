# ديسيت — DECEIT: Socket.IO Protocol & API Specification

> **Transport:** WebSocket / Socket.IO 4.x  
> **Data Format:** JSON  
> **Server Endpoint:** `http://localhost:3000`

---

## 1. Overview of Protocol Flow

Communication between the React client and Node.js Socket.IO server follows a strict server-authoritative event model:

```text
CLIENT                                      SERVER
  │                                           │
  ├─── room:create ──────────────────────────►│ (Validates host & creates room)
  │◄── room:created (RoomState) ──────────────┤ (Returns 5-char code A7K92)
  │                                           │
  ├─── room:join (code, name) ───────────────►│ (Validates room & seat limits)
  │◄── room:updated (RoomState) ──────────────┤ (Broadcasts to all room members)
  │                                           │
  ├─── player:ready ─────────────────────────►│ (Updates player status)
  │                                           │
  ├─── game:start (Host only) ───────────────►│ (Distributes roles, creates game)
  │◄── game:state (PublicState) ──────────────┤ (Broadcasts public state)
  │◄── game:intel (PrivateState) ─────────────┤ (Emits private role/intel to specific player)
  │                                           │
  ├─── game:action (Night/Day/Vote intent) ──►│ (Validates turn, phase & rules)
  │◄── game:action_ack ───────────────────────┤ (Acknowledges action)
  │◄── game:phase_change ─────────────────────┤ (Broadcasts phase transition)
```

---

## 2. Event Specification Table

### 2.1 Room Events

#### `room:create`
- **Direction:** Client ➔ Server
- **Payload:**
  ```typescript
  {
    hostName: string;
    avatarId?: string;
  }
  ```
- **Validation:** `hostName` non-empty, length 2–20 characters.
- **Server Behavior:** Creates new room with random 5-character uppercase code (e.g. `A7K92`), sets sender as host (`isHost: true`), assigns persistent `playerId`.
- **Responses:**
  - `room:created`: Sends `RoomState` to sender.
  - `error`: `{ code: 'INVALID_NAME', message: string }`.
- **Recipient:** Sender socket.

---

#### `room:join`
- **Direction:** Client ➔ Server
- **Payload:**
  ```typescript
  {
    roomCode: string;
    playerName: string;
    avatarId?: string;
    reconnectPlayerId?: string;
  }
  ```
- **Validation:**
  - `roomCode` exists and is active.
  - Room status is `LOBBY` (unless reconnecting).
  - Player count < 20.
  - `playerName` unique within room.
- **Server Behavior:**
  - If `reconnectPlayerId` matches an existing player in an ongoing game, rebinds socket to that player and emits full private/public state.
  - Else adds new player to room.
- **Responses:**
  - `room:joined`: `{ roomCode, player: PlayerPublic }` to sender.
  - `room:updated`: `RoomState` broadcast to room.
  - `error`: `{ code: 'ROOM_FULL' | 'ROOM_NOT_FOUND' | 'NAME_TAKEN', message: string }`.
- **Recipient:** All sockets in room.

---

#### `room:leave`
- **Direction:** Client ➔ Server
- **Payload:** `{}`
- **Server Behavior:** Removes player from room. If host leaves, assigns next living player as host. If room empty, destroys room.
- **Recipient:** Remaining room members (`room:updated`).

---

#### `player:ready` / `player:unready`
- **Direction:** Client ➔ Server
- **Payload:** `{ ready: boolean }`
- **Server Behavior:** Updates player readiness in lobby.
- **Recipient:** All room members (`room:updated`).

---

### 2.2 Game Flow & Control Events

#### `game:start`
- **Direction:** Client ➔ Server
- **Payload:**
  ```typescript
  {
    settings: MatchSettings;
  }
  ```
- **Validation:**
  - Sender must be room host.
  - Room player count between 5 and 20.
  - All players (or majority, depending on host settings) ready.
- **Server Behavior:**
  - Runs `RoleDistributor` to assign roles & seating turn order.
  - Initializes `GameEngine` instance.
  - Sets room status to `IN_GAME`.
  - Dispatches private role intel to each player (`game:intel`).
  - Emits initial public state (`game:state`).
- **Recipient:** All room members.

---

#### `game:action`
- **Direction:** Client ➔ Server
- **Payload:**
  ```typescript
  {
    actionType: 'NIGHT_ABILITY' | 'VOTE' | 'JUDGE_VETO' | 'END_DISCUSSION';
    targetIds?: string[];
  }
  ```
- **Validation:**
  - Room must be in matching phase (`NIGHT` for night ability, `VOTING` for vote, `DAY_POWERS` for Judge veto).
  - Player must be alive and in room.
  - Validates turn order, cooldowns, targeting constraints (`canTargetSelf`, `canTargetAllies`, `canTargetKing`, `noRepeatTarget`).
- **Server Behavior:**
  - Executes action on `GameEngine`.
  - If night phase complete, triggers `resolveNight()` and advances phase to `MORNING`.
  - If vote complete, tallies votes, handles tie/runoff, and advances phase to `DAY_POWERS` or `ELIMINATION`.
- **Responses:**
  - `game:action_ack`: `{ success: true }`.
  - `error`: `{ code: 'INVALID_ACTION', message: string }`.
- **Recipient:** Sender (acknowledgment), Room (state update on phase progress).

---

#### `game:state` (Public Broadcast)
- **Direction:** Server ➔ Client
- **Payload:** `PublicGameState`
  ```typescript
  {
    matchId: string;
    roomCode: string;
    status: GameStatus;
    currentNight: number;
    dayNumber: number;
    phaseEndsAt?: number; // Epoch timestamp in ms for server-authoritative timer
    players: PlayerPublic[];
    aliveCount: number;
    eliminatedPlayer?: PlayerPublic;
    narration?: string;
    activeEvents: GameEventPublic[];
    runoffPending: boolean;
    runoffCandidates: PlayerPublic[];
    victory: VictoryOutcome;
    timeline: TimelineEventPublic[];
  }
  ```
- **Recipient:** Broadcast to all connected sockets in room.

---

#### `game:intel` (Private Direct Socket Message)
- **Direction:** Server ➔ Client (Private)
- **Payload:** `PrivatePlayerState`
  ```typescript
  {
    playerId: string;
    role: RolePrivate; // Secrets: lore, ability details, warnings
    faction: Faction;
    allies?: { id: string; name: string; roleName?: string }[]; // Visible to Shadows
    owedIntel: PrivateIntel[];
    availableActions: AvailableAction[];
    hasUsedBonusAttack?: boolean;
    nightCooldownRemaining: number;
  }
  ```
- **Recipient:** Direct socket of specified `playerId` only. NEVER broadcast to room.

---

## 3. Disconnection & Reconnection Protocol

```text
Player Disconnects (Network loss / tab refresh)
  │
  ├─► Server keeps player in GameState as disconnected (`isOnline: false`).
  ├─► If disconnected during active turn:
  │    └─► Phase timer continues running server-authoritative.
  │    └─► If timer expires before reconnect, default action taken (e.g. skip night action / skip vote).
  │
  └─► Player Reconnects (re-opens browser tab):
       ├─► Client emits `room:join` with saved `reconnectPlayerId` & `roomCode`.
       ├─► Server rebinds socket ID to player entity.
       └─► Server emits immediate `game:state` (Public) and `game:intel` (Private).
```

---

## 4. Error Codes Catalogue

| Error Code | HTTP / Socket Context | Message (AR / EN) | Cause |
| :--- | :--- | :--- | :--- |
| `ROOM_NOT_FOUND` | Room Join | الغرفة غير موجودة / Room not found | Invalid 5-char code |
| `ROOM_FULL` | Room Join | الغرفة ممتلئة (الحد الأقصى ٢٠ لاعبًا) / Room is full | Reached 20 players |
| `GAME_IN_PROGRESS` | Room Join | اللعبة بدأت بالفعل / Game already in progress | Attempting to join live game without valid `reconnectPlayerId` |
| `INVALID_NAME` | Room Create / Join | الاسم غير صالح / Invalid player name | Empty or exceeds 20 chars |
| `NOT_HOST` | Game Start | هذا الإجراء متاح لمضيف الغرفة فقط / Only host can perform this | Non-host socket sent `game:start` |
| `NOT_ENOUGH_PLAYERS`| Game Start | يلزم ٥ لاعبين على الأقل / Minimum 5 players required | Player count < 5 |
| `INVALID_ACTION` | Game Action | حركة غير قانونية / Invalid action | Failed rule validation (cooldown, dead actor, invalid target) |
| `NOT_YOUR_TURN` | Game Action | ليس دورك الآن / Not your turn | Sent action outside player turn / phase |
