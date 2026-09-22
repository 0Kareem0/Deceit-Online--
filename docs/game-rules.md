# ديسيت — DECEIT: Game Rules & Specifications

> **"ليس كل من يبتسم حليفًا..."**  
> A social deduction game set in a dark Arabian fantasy universe between the Kingdom (المملكة), the Shadows (الظلال), and Neutral characters (المحايدين).

---

## 1. Overview & Player Limits

- **Player Count:** 5 to 20 players.
- **Language:** Dual support (Arabic primary / English secondary).
- **Core Objective:**
  - **Kingdom (المملكة):** Protect the King and eliminate all Shadow members.
  - **Shadows (الظلال):** Eliminate the King or outnumber/break parity with the Kingdom.
  - **Neutral (محايد):** Achieve unique individual win conditions (e.g., Trickster wants to be voted out).
- **Game Master (الراوي / مدير اللعبة):**
  - In the offline version, the app itself acts as an automated Game Master (managing turns, resolving abilities secretly, narrating events via audio/text).
  - In the online version, the server operates as the authoritative Game Master, while the room host manages room creation and game start.

---

## 2. Factions & Victory Conditions

### Factions

1. **Kingdom (المملكة)**:
   - Green / Gold aesthetic.
   - Must protect the Throne and identify disguised Shadow members during discussions and voting.
2. **Shadows (الظلال)**:
   - Red / Dark aesthetic.
   - Know their fellow Shadow allies (except under specific game settings/variants).
   - Collaborate to assassinate key Kingdom members during the Night phase without revealing their identities.
3. **Neutral (محايد)**:
   - Purple / Grey aesthetic.
   - Independent goals that do not depend on Kingdom or Shadow team outcomes.

### Victory Conditions (Evaluated in strict priority order)

1. **Tier 1: Neutral Solo Victory (e.g., Trickster - المخادع)**
   - If the Trickster is eliminated by public **Voting**, the Trickster wins instantly and the game ends.
   - *Note:* If the Trickster dies at night or by an ability, they lose.
2. **Tier 2: King Must Survive Rule (`king_must_survive`)**
   - If enabled in settings: If no living King remains (after Crown Prince succession has processed), **Shadows win immediately**.
3. **Tier 3: Shadows Eliminated (`shadows_eliminated`)**
   - If 0 living Shadow members remain, **Kingdom wins immediately**.
4. **Tier 4: Shadows Outnumber (`shadows_outnumber`)**
   - If living Shadows > living Kingdom members, **Shadows win immediately** (Shadows control all future votes).
5. **Tier 4: Shadows Break Parity (`shadows_break_parity`)**
   - If living Shadows == living Kingdom members AND the Shadows still possess night kill capabilities (Assassin, Slasher, or Poisoner without an active Doctor to cure), **Shadows win immediately**.

---

## 3. Complete Roles Catalogue

### 3.1 Kingdom Roles (فريق المملكة)

| Role ID | Role Name (AR) | Role Name (EN) | Type | Ability Description | Constraints & Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `king` | الملك | King | Mandatory / Special | Ruler of the realm. No night ability. | If King dies, Crown Prince ascends. If no heir lives and `kingMustSurvive` is enabled, Shadows win. |
| `crown_prince` | ولي العهد | Crown Prince | Special | Passive succession. | Automatically becomes the new King upon the King's death without voting. |
| `minister` | الوزير | Minister | Support | Instant daily faction intel. | Receives a secret accurate report of a random living player's faction every day. System chooses target; cannot target self; Forger cannot mislead Minister. |
| `guard` | الحارس | Guard | Support | Night protection shield. | Protects 1 player from the 1st direct lethal attack of the night. Can target self. Does NOT block poison. |
| `doctor` | الطبيب | Doctor | Support | Night healing. | Heals poison and curable effects. Can heal self, but CANNOT heal self two nights in a row. |
| `investigator` | المحقق | Seer | Support | Night investigation. | Inspects a player's faction (intel delivered on next turn). Fooled by Forger. Cannot target self. Cooldown scales with player count (2-3 nights). |
| `judge` | القاضي | Judge | Special | Day Veto power. | Can veto a voting result before execution (up to 7 uses per match, 3-day cooldown). Publicly announced as the Judge. |
| `wizard` | الساحر | Wizard | Special | Night silence. | Silences a player from speaking in the next day's discussion. Cannot target the same player consecutive nights. |
| `priest` | الكاهن | Priest | Support | Night cleanse. | Cleanses forgery, curses, and negative status effects. Can target self. |
| `messenger` | الرسول | Messenger | Support | Night comparison. | Compares 2 players to see if they share a faction. Does not reveal faction identity. |
| `knight` | الفارس | Knight | Attack / Shield | Night sacrifice. | Sacrifices self to absorb a lethal attack targeted at their chosen ward. |
| `royal_guard` | الحارس الملكي | Royal Guard | Support | Passive King protection. | While Royal Guard is alive, the King cannot be directly attacked at night. |
| `hermit` | الناسك | Hermit | Special | Passive immunity. | Immune to all night abilities on Night 1 and Night 2. |
| `citizen` | المواطن | Citizen | Basic | No night ability. | Relies purely on discussion, deduction, and voting. |

### 3.2 Shadow Roles (فريق الظلال)

| Role ID | Role Name (AR) | Role Name (EN) | Type | Ability Description | Constraints & Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `shadow_leader` | زعيم الظلال | Shadow Leader | Special | Proposed target mark. | Proposes an attack target to the Assassin. Only Shadow Leader sees immune players (Hermit). Proposal is non-binding. |
| `assassin` | القاتل | Assassin | Mandatory / Attack | Night direct kill. | Executes the direct lethal attack. Can follow or ignore Shadow Leader's proposal. Cannot target Shadow allies. |
| `saboteur` | المخرب | Saboteur | Support | Night ability block. | Blocks active night ability of target for current night. Cannot block passive abilities. Cannot target same player consecutive nights. |
| `forger` | المزور | Forger | Support | Night frame/forgery. | Causes target to return false faction if inspected by Investigator tonight. Does NOT affect Minister or Messenger. Cannot target same player consecutive nights. |
| `poisoner` | السمّام | Poisoner | Attack | Night poison. | Poisons target. Target dies after 1 night unless healed by Doctor. Not direct attack (bypasses Guard shield). Cannot target allies. |
| `slasher` | السفاح | Slasher | Attack | Bonus attack on kill. | Gains 1 extra bonus attack after 1st successful kill. Cooldown scales with player count. Cannot target allies. |
| `spy` | الجاسوس | Spy | Support | Night surveillance. | Eavesdrops on a target to discover who visited them tonight. Does not learn visitor roles or action types. |
| `impersonator` | المنتحل | Impersonator | Special | Ability copy. | Copies a living player's active night ability for 1 night and uses it on a target. Cannot copy King, Citizen, or passive roles. |

### 3.3 Neutral Roles (الشخصيات المحايدة)

| Role ID | Role Name (AR) | Role Name (EN) | Type | Win Condition | Constraints & Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `trickster` | المخادع | Trickster | Special | Be voted out during Day Voting. | Has no night ability. Must persuade the table to vote them out. If killed at night, Trickster loses. |

---

## 4. Game Flow & Phase Sequence

The game progresses through a structured cyclic state machine:

```text
[LOBBY] 
   │ (Room creation, player joining, settings configuration)
   ▼
[ROLE ASSIGNMENT] 
   │ (RoleDistributor generates balanced role pool & turn order)
   ▼
[ROLE REVEAL] 
   │ (Private presentation of assigned role & lore)
   ▼
┌─────────────────────────────────────────────────────────────┐
│                       MATCH CYCLE                           │
│                                                             │
│   [NIGHT PHASE]                                             │
│      - Players submit night actions according to turn order │
│      - Engine resolves actions by ABILITY CLASS STAGE       │
│                                                             │
│   [MORNING SUMMARY]                                         │
│      - Overnight deaths, saves, silences & events announced │
│      - Succession (Crown Prince -> King) checked            │
│      - Victory conditions evaluated                         │
│                                                             │
│   [DISCUSSION PHASE]                                        │
│      - Timed council debate (Silenced players cannot speak) │
│                                                             │
│   [VOTING PHASE]                                            │
│      - Secret ballot vote                                   │
│      - Runoff vote if tied; Lot (قرعة) if runoff ties       │
│                                                             │
│   [DAY POWERS PHASE]                                        │
│      - Day abilities (Judge Veto) executed if triggered     │
│                                                             │
│   [ELIMINATION PHASE]                                       │
│      - Condemned player eliminated                          │
│      - Role revealed (if enabled in settings)               │
│      - Victory conditions evaluated                         │
└─────────────────────────────────────────────────────────────┘
   │ (If victory condition met)
   ▼
[GAME OVER & SCORING]
```

---

## 5. Night Ability Resolution Order (Stages 0–9)

Night actions resolve in fixed ability class stages regardless of player seating order:

| Stage | Ability Kind | Roles Executing | Description |
| :---: | :--- | :--- | :--- |
| **0** | `block` | Saboteur | Disables active night ability of target for tonight. |
| **1** | `mark` | Shadow Leader | Sets proposed target recommendation for Assassin. |
| **2** | `protect` / `heal` | Guard, Doctor, Priest | Raises protection shields, cures poison, cleanses negative effects. |
| **3** | `frame` | Forger | Frames target so Seer investigation returns false intel. |
| **4** | `copy` | Impersonator | Copies target's active night ability and queues it in its native stage. |
| **5** | `attack` / `poison` | Assassin, Slasher, Poisoner | Direct lethal attacks and poison applications. |
| **6** | `sacrifice` | Knight | Redirects lethal attack onto Knight if ward is targeted. |
| **7** | *Deaths Applied* & `silence` | Wizard | Direct attack deaths processed; Wizard silences target for next day. |
| **8** | `investigate` / `compare` | Investigator, Messenger | Faction checks and comparison intel generated. |
| **9** | `watch` | Spy | Gathers list of all visitors who targeted the watched player tonight. |

---

## 6. Voting, Ties, and Runoff Mechanics

1. **Ballot**: Every living player gets 1 vote. Players may vote for any other living player or skip.
2. **Plurality Verdict**: Player with the strict majority/plurality of votes is condemned.
3. **Runoff (جولة الإعادة)**: If top votes tie, a single runoff vote occurs between tied candidates.
4. **Lot (قرعة)**: If the runoff vote also ends in a tie (or if deadlock stalls for 2+ consecutive rounds), a random lot (قرعة) publicly picks the eliminated player to break the stalemate.
5. **Judge Veto**: After voting completes, the Judge can exercise their day power to annul the verdict, saving the condemned player.

---

## 7. Scoring System

When scoring is enabled (`enableScoring = true`):
- **Win / Loss**: +1 point for win, -1 point for loss.
- **Private Goal**: +1 point for completing role personal goal.
- **Survival**: +1 point for surviving match.
- **Ability Success**: +1 point per successful ability resolution.
- Minimum score per player is clamped to 1 point.
