import {
  Player,
  Role,
  NightAction,
  NightAbilityKind,
  Faction,
  PrivateIntel,
  TimelineEvent,
  AbilityResult,
  EventType,
  EliminationCause,
} from '@deceit/shared';

export interface NightOutcome {
  results: Record<string, AbilityResult>;
  intel: PrivateIntel[];
  killed: Player[];
  saved: Player[];
  silenced: Player[];
  blockedActors: Player[];
  recommendation?: string;
  events: TimelineEvent[];
}

interface QueuedAction {
  action: NightAction;
  role: Role;
}

interface PendingKill {
  attacker: Player;
  victim: Player;
}

interface ShieldIntervention {
  protector: Player;
  target: Player;
  blockedAttack: boolean;
}

export class NightResolver {
  private players: Player[];
  private actions: NightAction[];
  private night: number;
  private turnOrder: string[];
  private hasEvent: (type: EventType) => boolean;

  private results: Record<string, AbilityResult> = {};
  private intel: PrivateIntel[] = [];
  private kills: PendingKill[] = [];
  private killed: Player[] = [];
  private saved: Player[] = [];
  private blockedActors: Player[] = [];
  private events: TimelineEvent[] = [];
  private recommendation?: string;

  private shields: ShieldIntervention[] = [];
  private forgedTargetIds: Set<string> = new Set();
  private byStage: Map<number, QueuedAction[]> = new Map();

  constructor(
    players: Player[],
    actions: NightAction[],
    night: number,
    turnOrder: string[],
    hasEvent: (type: EventType) => boolean
  ) {
    this.players = players;
    this.actions = actions;
    this.night = night;
    this.turnOrder = turnOrder;
    this.hasEvent = hasEvent;
  }

  public resolve(): NightOutcome {
    // 1. Bucket actions by ability stage (0-9)
    for (const action of this.actions) {
      const actor = this.getPlayer(action.playerId);
      const role = actor?.role;
      if (!actor || !role || role.nightAbilityKind === NightAbilityKind.none) continue;

      const stage = this.getStageForKind(role.nightAbilityKind);
      if (!this.byStage.has(stage)) {
        this.byStage.set(stage, []);
      }
      this.byStage.get(stage)!.push({ action, role });
    }

    // Sort actions within each stage by turnOrder seating
    for (const bucket of this.byStage.values()) {
      bucket.sort((a, b) => {
        const ia = this.turnOrder.indexOf(a.action.playerId);
        const ib = this.turnOrder.indexOf(b.action.playerId);
        return (ia < 0 ? this.turnOrder.length : ia) - (ib < 0 ? this.turnOrder.length : ib);
      });
    }

    // 2. Resolve stage by stage
    for (let stage = 0; stage <= 9; stage++) {
      if (stage === 7) {
        this.applyDeaths();
      }
      const queuedList = this.byStage.get(stage) || [];
      for (const queued of [...queuedList]) {
        this.runAction(queued);
      }
    }

    const silenced = this.players.filter((p) => p.isAlive && p.isSilenced);

    return {
      results: this.results,
      intel: this.intel,
      killed: this.killed,
      saved: this.saved,
      silenced,
      blockedActors: this.blockedActors,
      recommendation: this.recommendation,
      events: this.events,
    };
  }

  private getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  private getStageForKind(kind: NightAbilityKind): number {
    switch (kind) {
      case NightAbilityKind.block: return 0;
      case NightAbilityKind.mark: return 1;
      case NightAbilityKind.protect:
      case NightAbilityKind.heal: return 2;
      case NightAbilityKind.frame: return 3;
      case NightAbilityKind.copy: return 4;
      case NightAbilityKind.attack:
      case NightAbilityKind.poison: return 5;
      case NightAbilityKind.sacrifice: return 6;
      case NightAbilityKind.silence: return 7;
      case NightAbilityKind.investigate:
      case NightAbilityKind.compare: return 8;
      case NightAbilityKind.watch: return 9;
      default: return 99;
    }
  }

  private gate(actor: Player, role: Role, targets: Player[]): AbilityResult | null {
    if (!actor.isAlive) {
      return { success: false, message: 'اللاعب متوفى ولا يمكنه استخدام القدرة.' };
    }
    if (actor.isAbilityBlocked) {
      this.blockedActors.push(actor);
      return { success: false, message: 'تم تعطيل قدرتك هذه الليلة بواسطة المخرب.' };
    }
    if (this.hasEvent(EventType.darkFog) && this.isInformationAbility(role.nightAbilityKind)) {
      return { success: false, message: 'منعت الضبابية المظلمة الرؤية هذه الليلة.' };
    }
    if (this.hasEvent(EventType.peacefulNight) && (role.nightAbilityKind === NightAbilityKind.attack || role.nightAbilityKind === NightAbilityKind.poison)) {
      return { success: false, message: 'ساد السلام هذه الليلة ولا يمكن تنفيذ أي هجوم.' };
    }

    // Check Hermit immunity on night 1 & 2
    for (const target of targets) {
      if (target.role?.id === 'hermit' && target.role?.immuneThroughNight && this.night <= target.role.immuneThroughNight) {
        if (this.isHostileAbility(role.nightAbilityKind)) {
          return { success: false, message: 'الهدف محصن ضد القدرات الليلية.', affectedPlayers: [target.id] };
        }
      }
    }

    return null;
  }

  private isInformationAbility(kind: NightAbilityKind): boolean {
    return kind === NightAbilityKind.investigate || kind === NightAbilityKind.compare || kind === NightAbilityKind.watch;
  }

  private isHostileAbility(kind: NightAbilityKind): boolean {
    return [
      NightAbilityKind.attack,
      NightAbilityKind.poison,
      NightAbilityKind.block,
      NightAbilityKind.frame,
      NightAbilityKind.silence,
      NightAbilityKind.investigate,
      NightAbilityKind.watch,
      NightAbilityKind.mark,
    ].includes(kind);
  }

  private runAction(queued: QueuedAction) {
    const actor = this.getPlayer(queued.action.playerId);
    if (!actor) return;
    const role = queued.role;
    const targets = queued.action.targetIds
      .map((id) => this.getPlayer(id))
      .filter((p): p is Player => p !== undefined);

    const gateFail = this.gate(actor, role, targets);
    if (gateFail) {
      this.results[actor.id] = gateFail;
      return;
    }

    switch (role.nightAbilityKind) {
      case NightAbilityKind.block:
        this.runBlock(actor, targets[0]);
        break;
      case NightAbilityKind.mark:
        this.runMark(actor, targets[0]);
        break;
      case NightAbilityKind.protect:
        this.runProtect(actor, targets[0]);
        break;
      case NightAbilityKind.heal:
        this.runHeal(actor, targets[0]);
        break;
      case NightAbilityKind.frame:
        this.runFrame(actor, targets[0]);
        break;
      case NightAbilityKind.copy:
        this.runCopy(actor, targets[0], queued.action.targetIds[1]);
        break;
      case NightAbilityKind.attack:
        this.runAttack(actor, targets[0]);
        break;
      case NightAbilityKind.poison:
        this.runPoison(actor, targets[0]);
        break;
      case NightAbilityKind.sacrifice:
        this.runSacrifice(actor, targets[0]);
        break;
      case NightAbilityKind.silence:
        this.runSilence(actor, targets[0]);
        break;
      case NightAbilityKind.investigate:
        this.runInvestigate(actor, targets[0]);
        break;
      case NightAbilityKind.compare:
        this.runCompare(actor, targets[0], targets[1]);
        break;
      case NightAbilityKind.watch:
        this.runWatch(actor, targets[0]);
        break;
      default:
        break;
    }
  }

  private runBlock(actor: Player, target?: Player) {
    if (!target) return;
    target.isAbilityBlocked = true;
    this.results[actor.id] = { success: true, message: `تم تعطيل قدرة ${target.name} بنجاح.` };
  }

  private runMark(actor: Player, target?: Player) {
    if (!target) return;
    this.recommendation = target.name;
    this.results[actor.id] = { success: true, message: `تم اختيار ${target.name} كهدف مقترح للاغتيال.` };
  }

  private runProtect(actor: Player, target?: Player) {
    if (!target) return;
    this.shields.push({ protector: actor, target, blockedAttack: false });
    this.results[actor.id] = { success: true, message: `تم وضع درع الحماية على ${target.name}.` };
  }

  private runHeal(actor: Player, target?: Player) {
    if (!target) return;
    if (target.poisonedCount > 0) {
      target.poisonedCount = 0;
      this.saved.push(target);
      this.results[actor.id] = { success: true, message: `تم شفاء ${target.name} من السم.` };
    } else {
      this.results[actor.id] = { success: true, message: `تم تطبيق العلاج على ${target.name}.` };
    }
  }

  private runFrame(actor: Player, target?: Player) {
    if (!target) return;
    this.forgedTargetIds.add(target.id);
    this.results[actor.id] = { success: true, message: `تم تزوير هوية ${target.name} لهذه الليلة.` };
  }

  private runCopy(actor: Player, targetToCopy?: Player, secondTargetId?: string) {
    if (!targetToCopy || !targetToCopy.role) {
      this.results[actor.id] = { success: false, message: 'لم يتم العثور على قدرة صالحة للنسخ.' };
      return;
    }

    const copiedRole = targetToCopy.role;
    if ([ 'king', 'citizen', 'crown_prince', 'royal_guard', 'hermit' ].includes(copiedRole.id)) {
      this.results[actor.id] = { success: false, message: 'هذا الدور لا يملك قدرة نشطة يمكن نسخها.' };
      return;
    }

    const target2 = this.getPlayer(secondTargetId || '');
    const clonedAction: NightAction = {
      playerId: actor.id,
      targetIds: target2 ? [target2.id] : [],
    };
    const stage = this.getStageForKind(copiedRole.nightAbilityKind);
    this.byStage.get(stage)?.push({ action: clonedAction, role: copiedRole });

    this.results[actor.id] = { success: true, message: `تم نسخ قدرة ${copiedRole.name} بنجاح.` };
  }

  private runAttack(actor: Player, target?: Player) {
    if (!target) return;
    this.kills.push({ attacker: actor, victim: target });
  }

  private runPoison(actor: Player, target?: Player) {
    if (!target) return;
    // Poison ticks after 2 nights (ends next night)
    target.poisonedCount = 2;
    this.results[actor.id] = { success: true, message: `تم تسميم ${target.name}.` };
  }

  private runSacrifice(actor: Player, target?: Player) {
    if (!target) return;
    // Redirect direct attack from target to Knight
    const killIdx = this.kills.findIndex((k) => k.victim.id === target.id);
    if (killIdx >= 0) {
      this.kills[killIdx].victim = actor; // Knight dies instead
      this.results[actor.id] = { success: true, message: `ضحيت بنفسك لإنقاذ ${target.name}.` };
    }
  }

  private runSilence(actor: Player, target?: Player) {
    if (!target) return;
    target.isSilenced = true;
    this.results[actor.id] = { success: true, message: `تم إسكات ${target.name} لمجلس الغد.` };
  }

  private runInvestigate(actor: Player, target?: Player) {
    if (!target || !target.role) return;
    let faction = target.role.faction;
    if (this.forgedTargetIds.has(target.id)) {
      // Return opposite faction if forged
      faction = faction === Faction.kingdom ? Faction.shadow : Faction.kingdom;
    }

    const body = faction === Faction.kingdom
      ? `${target.name} ينتمي إلى فريق المملكة.`
      : faction === Faction.shadow
      ? `${target.name} ينتمي إلى فريق الظلال.`
      : `${target.name} شخصية محايدة.`;

    this.intel.push({
      playerId: actor.id,
      playerName: actor.name,
      roleId: 'investigator',
      roleName: 'المحقق',
      roleIcon: '🔍',
      title: 'تقرير التحقيق السرّي',
      body,
      targetNames: [target.name],
      revealedFaction: faction,
      success: true,
    });

    this.results[actor.id] = { success: true, message: 'وصلك تقرير التحقيق.' };
  }

  private runCompare(actor: Player, t1?: Player, t2?: Player) {
    if (!t1 || !t2 || !t1.role || !t2.role) return;
    const sameTeam = t1.role.faction === t2.role.faction && t1.role.faction !== Faction.neutral;
    const body = sameTeam
      ? `${t1.name} و ${t2.name} ينتميان إلى نفس الفريق.`
      : `${t1.name} و ${t2.name} ينتميان إلى فريقين مختلفين.`;

    this.intel.push({
      playerId: actor.id,
      playerName: actor.name,
      roleId: 'messenger',
      roleName: 'الرسول',
      roleIcon: '🕊️',
      title: 'نتيجة المقارنة',
      body,
      targetNames: [t1.name, t2.name],
      resultLabel: sameTeam ? 'نفس الفريق' : 'فريقين مختلفين',
      success: true,
    });

    this.results[actor.id] = { success: true, message: 'تم استلام نتيجة المقارنة.' };
  }

  private runWatch(actor: Player, target?: Player) {
    if (!target) return;
    const visitors = this.actions
      .filter((a) => a.playerId !== actor.id && a.targetIds.includes(target.id))
      .map((a) => this.getPlayer(a.playerId)?.name)
      .filter((name): name is string => name !== undefined);

    const body = visitors.length > 0
      ? `الأشخاص الذين زاروا ${target.name} الليلة: ${visitors.join('، ')}`
      : `لم يقم أحد بزيارة ${target.name} الليلة.`;

    this.intel.push({
      playerId: actor.id,
      playerName: actor.name,
      roleId: 'spy',
      roleName: 'الجاسوس',
      roleIcon: '🕶️',
      title: 'تقرير التنصّت',
      body,
      targetNames: [target.name, ...visitors],
      success: true,
    });

    this.results[actor.id] = { success: true, message: 'تم تسجيل زوار الهدف.' };
  }

  private applyDeaths() {
    for (const kill of this.kills) {
      const victim = kill.victim;
      const attacker = kill.attacker;

      if (!victim.isAlive) {
        // Multi-attacker target already dead handling
        this.results[attacker.id] = { success: false, message: 'الهدف تم القضاء عليه بالفعل.' };
        continue;
      }

      // Check Guard Shield Protection (1 Shield = 1 Attack absorbed)
      const shieldIdx = this.shields.findIndex((s) => s.target.id === victim.id && !s.blockedAttack);
      if (shieldIdx >= 0) {
        this.shields[shieldIdx].blockedAttack = true;
        this.saved.push(victim);
        this.results[attacker.id] = { success: false, message: 'تم إحباط الهجوم بواسطة درع الحارس.' };
        continue;
      }

      // Check Royal Guard passive (King protected if Royal Guard alive)
      if (victim.role?.id === 'king') {
        const royalGuard = this.players.find((p) => p.role?.id === 'royal_guard' && p.isAlive);
        if (royalGuard) {
          this.saved.push(victim);
          this.results[attacker.id] = { success: false, message: 'تصدى الحارس الملكي للهجوم على الملك.' };
          continue;
        }
      }

      // Apply Kill
      victim.isAlive = false;
      victim.eliminationCause = EliminationCause.killed;
      this.killed.push(victim);
      this.results[attacker.id] = { success: true, message: `نجح اغتيال ${victim.name}.` };

      // Check Slasher bonus attack logic fix
      if (attacker.role?.id === 'slasher' && !attacker.hasUsedBonusAttack) {
        attacker.hasUsedBonusAttack = true;
      }
    }
  }
}
