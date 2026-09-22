# ديسيت — DECEIT: Offline Application Analysis & Architectural Audit

> **Scope:** Comprehensive Codebase Analysis of `/home/elite/programming/apps/deceit`  
> **Date:** September 2026  
> **Target:** Foundation for Local Web Multiplayer Architecture (`/home/elite/programming/deceit-online-web`)

---

## 1. Project Overview & Codebase Structure

The offline version of **DECEIT (ديسيت)** is built as a single-device pass-the-phone Flutter mobile application.

### Key Metadata

- **Source Location:** `/home/elite/programming/apps/deceit`
- **Framework:** Flutter / Dart (SDK `^3.9.2`)
- **Package Name:** `deceit`
- **Primary Language:** Arabic (with English fallback support)
- **State Management:** `ChangeNotifier` (`GameEngine` extends `ChangeNotifier`)

### Core Directory Breakdown

```text
/home/elite/programming/apps/deceit/lib/
├── main.dart                       # Entry point, theme initialization & router
├── core/                           # System services & utilities
│   ├── app_config.dart             # Application configuration & feature flags
│   ├── app_strings.dart            # Dual-language string constants (AR/EN)
│   ├── mongodb_service.dart        # Database persistence connection (MongoDB)
│   ├── sound_manager.dart          # Audio manager (Music, SFX, Narrator)
│   ├── analytics_service.dart      # Match analytics telemetry
│   └── entitlements.dart           # Store entitlement gating for DLC roles
├── data/                           # Data models and role definitions
│   ├── models.dart                 # Core data entities (Player, Role, Vote, Faction, etc.)
│   ├── role_data.dart              # Complete catalogue of 22+ roles & constraints
│   ├── event_data.dart             # Game events registry (Dark Fog, Peaceful Night, etc.)
│   └── role_pool.dart              # Role distribution preset definitions
├── engine/                         # Core Game Engine logic
│   ├── game_engine.dart            # Primary state machine controller
│   ├── night_resolver.dart         # Stage-based deterministic night ability resolver
│   ├── victory_engine.dart         # Rule-based modular victory condition evaluator
│   ├── role_distributor.dart       # Algorithmic role assigner & turn order builder
│   └── scoring_engine.dart         # Match performance & scoring evaluator
├── models/                         # Secondary domain models
│   ├── ability_history.dart        # Player ability history entries
│   ├── night_status.dart           # Per-turn state tracking
│   └── timeline_model.dart         # Match timeline event logger
└── screens/                        # 24 UI Screen Widgets
    ├── home_screen.dart            # Main menu
    ├── create_game_screen.dart     # Player name entry (5-20 players)
    ├── game_settings_screen.dart   # Match rules & timers toggle
    ├── character_selection_screen.dart # Role pool customizer
    ├── role_reveal_screen.dart     # Pass-the-phone role reveal
    ├── night_phase_screen.dart     # Pass-the-phone night actions
    ├── morning_summary_screen.dart # Overnight events narration
    ├── discussion_screen.dart      # Timed council debate
    ├── voting_screen.dart          # Ballot & runoff voting
    ├── day_powers_screen.dart      # Day ability activation (Judge Veto)
    ├── elimination_screen.dart     # Verdict execution & role reveal
    └── game_over_screen.dart       # Victory recap & analytics
```

---

## 2. Player & Game Master Architecture Analysis

### Player Count & Lifecycle

- **Player Limits:** Minimum **5 players**, maximum **20 players**.
- **Player Structure:**
  - `id`: Unique identifier (UUID).
  - `name`: Display name.
  - `gender`: `male` or `female` (affects Arabic grammatical gender in narration).
  - `role`: Assigned `Role` object.
  - `isAlive`: Boolean flag.
  - `eliminationCause`: `votedOut`, `killed`, `poisoned`, or `sacrificed`.
  - `poisonedCount`: Countdown timer for poison fatality.
  - `isSilenced`: Boolean flag for Wizard silence.

### Game Master (GM) Behavior Analysis

Crucial finding from code inspection:
- **No Human GM Role:** There is NO separate human Game Master or moderator player.
- **Automated Digital GM:** The app engine itself acts as the Game Master:
  - Generates balanced role assignments via `RoleDistributor`.
  - Enforces secret pass-the-phone transitions.
  - Resolves night abilities in strict stage order via `NightResolver`.
  - Computes victory conditions automatically via `VictoryEngine`.
  - Plays voice narration (`playNarrator`) and displays story text for events.
- **Implication for Online Version:** The Node.js Express/Socket.IO backend server will adopt the exact role of the automated Game Master. Room hosts merely control lobby triggers (e.g., clicking "Start Game").

---

## 3. Deep Dive into Engine Components

### 3.1 Role Distributor (`RoleDistributor`)

- Ensures mandatory roles are assigned: `king` (Kingdom), `shadow_leader` (Shadows), and `assassin` (Shadows).
- Rest of the pool is randomly selected from active roles based on player count and selected preset.
- Generates a custom `turnOrder`:
  - If both `shadow_leader` and `assassin` exist, `assassin` is seated 1 to 4 positions after `shadow_leader` (scaled by total player count). This allows the leader's proposal to be visible before the Assassin makes their decision.

### 3.2 Night Resolver (`NightResolver`)

- Resolves all night actions in **fixed ability class stages** (Stage 0 to Stage 9) rather than seating order:
  - **Stage 0 (`block`)**: Saboteur disables active abilities.
  - **Stage 1 (`mark`)**: Shadow Leader marks target recommendation.
  - **Stage 2 (`protect`/`heal`)**: Guard shield, Doctor heal, Priest cleanse.
  - **Stage 3 (`frame`)**: Forger frames target for investigation.
  - **Stage 4 (`copy`)**: Impersonator copies target ability.
  - **Stage 5 (`attack`/`poison`)**: Assassin, Slasher attack; Poisoner poisons target.
  - **Stage 6 (`sacrifice`)**: Knight shields target by sacrificing self.
  - **Stage 7 (`deaths`/`silence`)**: Lethal attacks resolve; Wizard silences target.
  - **Stage 8 (`investigate`/`compare`)**: Investigator inspects faction; Messenger compares 2 targets.
  - **Stage 9 (`watch`)**: Spy checks visitors to target.
- Private intel is stored and delivered at the top of the recipient's turn on the next night, preventing identity leaks during daytime.

### 3.3 Victory Engine (`VictoryEngine`)

- Evaluates win conditions after night resolution and after elimination.
- Modular rule list evaluated in strict priority order:
  1. `TricksterRule` (Neutral solo win on vote elimination)
  2. `KingMustSurviveRule` (Shadow win if King dies with no heir)
  3. `ShadowsEliminatedRule` (Kingdom win if 0 Shadows remain)
  4. `ShadowsOutnumberRule` (Shadow win if Shadows > Kingdom)
  5. `ShadowsBreakParityRule` (Shadow win if Shadows == Kingdom and Shadows have active kill capability)

---

## 4. Discovered Exploits & Flaws in Offline Code

During our detailed audit of the Flutter source code, we uncovered the following logic and security issues:

1. **Slasher Infinite Night Kills Exploit (`game_engine.dart` #L1175)**:
   - *Flaw:* `_settleNightCooldowns` checks `role.cooldownOnFailureOnly` without toggling `actor.hasUsedBonusAttack = true`.
   - *Impact:* Slasher can kill a player every single night without cooldown as long as they don't miss.
2. **Double Attack & Shield Resolution (`night_resolver.dart` #L843)**:
   - *Flaw:* If an unprotected player suffers 2 attacks on the same night, Attack 1 kills the victim, while Attack 2 evaluates on an already-dead target without returning explicit status.
   - *Fix Needed:* Explicit `AppStrings.abilityTargetAlreadyDead` return code.
3. **Hardcoded MongoDB Credentials (`assets/config/secrets.json`)**:
   - *Security Risk:* Raw connection string bundled in assets (`mongodb+srv://deceit2026_db_user:...`).
   - *Remediation:* Environment variables (`.env`) for local development, zero bundled secrets.
4. **RTL Text Directionality Trap (`discussion_screen.dart` #L272)**:
   - *UI Bug:* LTR `Directionality` wrapper around Arabic player names causing punctuation and word reversal.

---

## 5. Architectural Blueprint for Online Local Multiplayer Web App

To convert DECEIT into a local web-based multiplayer game, we map the offline components into a **Server-Authoritative Node.js + React + Socket.IO Architecture**:

```text
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (React)                        │
│                                                             │
│  - Render UI based on Server Game State                      │
│  - Local state views: getPublicState(), getPrivateState()   │
│  - Socket listeners: room:state, game:state, game:intel     │
│  - Emit intent actions: room:create, player:action          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / WebSockets
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Express + Socket.IO)             │
│                                                             │
│  - Room Manager (Lobby, Room Codes, Player Reconnections)   │
│  - Shared TypeScript Types (`shared/types`)                 │
│  - Decoupled Game Engine (`server/src/game/GameEngine.ts`)  │
│  - Authoritative State Validation & Phase Timers            │
│  - Local MongoDB Persistence (`mongodb://localhost:27017`)  │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions for Online Version

1. **Decoupled Game Engine (`server/src/game/`)**:
   - Port Flutter `GameEngine.dart`, `NightResolver.dart`, `VictoryEngine.dart`, `RoleDistributor.dart` into pure TypeScript (`GameEngine.ts`, `NightResolver.ts`, etc.).
   - Zero React or Socket.IO dependency in engine files to allow isolated unit testing.
2. **Hidden Information (State Projection)**:
   - Server holds total state: `GameState`.
   - Clients only receive filtered state:
     - `getPublicGameState()`: Alive players, current phase, timers, public log.
     - `getPrivatePlayerState(playerId)`: Private role, private intel, available target choices.
3. **Local Room System**:
   - Room code format: 5 alphanumeric uppercase characters (e.g., `A7K92`).
   - Reconnection support: Player re-attaches using persistent `playerId` stored in client session/localStorage.
4. **Server-Authoritative Timers**:
   - Timers run on backend using `setInterval` or timestamp comparisons (`phaseEndsAt`).
   - Clients display countdowns calculated from server timestamps.
