import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerCard } from '../components/PlayerCard';
import { Crown, Users, Play, Settings, Shield, AlertTriangle, Check, Bot, UserPlus, UserMinus } from 'lucide-react';
import { MatchSettings } from '@deceit/shared';

export const Lobby: React.FC = () => {
  const { roomState, playerId, toggleReady, startGame, addBot, removeBot } = useSocket();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MatchSettings>(
    roomState?.settings || {
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
    }
  );

  if (!roomState) return null;

  const me = roomState.players.find((p) => p.id === playerId);
  const isHost = me?.isHost || false;
  const playerCount = roomState.players.length;
  const canStart = isHost && playerCount >= 5;

  const handleStart = () => {
    startGame(settings);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-kufi gold-gradient-text">غرفة الانتظار — Lobby</h2>
            <span className="text-xs bg-gold/10 border border-gold/30 text-gold px-2.5 py-0.5 rounded-full font-mono font-bold">
              {roomState.roomCode}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-cairo mt-1">
            شارك رمز الغرفة مع أصدقائك للانضمام عبر الشبكة المحلية (Local Network)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isHost && (
            <>
              <button
                onClick={addBot}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-900 transition-all text-xs font-bold font-cairo flex items-center gap-1.5"
                title="إضافة لاعب آلي (Bot)"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                إضافة بوت 🤖
              </button>

              <button
                onClick={() => removeBot()}
                className="px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:border-red-500 hover:text-red-300 transition-all text-xs font-bold font-cairo flex items-center gap-1.5"
                title="إزالة بوت"
              >
                <UserMinus className="w-4 h-4 text-red-400" />
                إزالة بوت
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2.5 rounded-xl glass-panel border border-stone-700 text-stone-200 hover:border-gold hover:text-gold transition-all text-xs font-bold font-cairo flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-gold" />
                إعدادات المباراة
              </button>
            </>
          )}

          <button
            onClick={() => toggleReady(!me?.isReady)}
            className={`px-5 py-2.5 rounded-xl font-bold font-cairo text-xs transition-all ${
              me?.isReady
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(76,175,80,0.4)]'
                : 'bg-stone-800 border border-stone-700 text-stone-300 hover:border-emerald-500'
            }`}
          >
            {me?.isReady ? 'جاهز!' : 'تأكيد الجاهزية'}
          </button>
        </div>
      </div>

      {/* Settings Panel Modal */}
      {showSettings && isHost && (
        <div className="glass-panel border-2 border-gold/40 rounded-2xl p-5 space-y-4 animate-fade-in bg-stone-900/90">
          <h3 className="text-lg font-bold font-kufi text-gold border-b border-stone-800 pb-2">
            خيارات وقواعد المباراة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-void/60 border border-stone-800 cursor-pointer">
              <span className="text-xs font-cairo text-stone-200">كشف دور اللاعب المستبعد</span>
              <input
                type="checkbox"
                checked={settings.revealEliminatedRole}
                onChange={(e) => setSettings({ ...settings, revealEliminatedRole: e.target.checked })}
                className="w-4 h-4 accent-gold"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-void/60 border border-stone-800 cursor-pointer">
              <span className="text-xs font-cairo text-stone-200">الملك يجب أن ينجو (King Must Survive)</span>
              <input
                type="checkbox"
                checked={settings.kingMustSurvive}
                onChange={(e) => setSettings({ ...settings, kingMustSurvive: e.target.checked })}
                className="w-4 h-4 accent-gold"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-void/60 border border-stone-800 cursor-pointer">
              <span className="text-xs font-cairo text-stone-200">تضمين الشخصيات المحايدة (Neutral Roles)</span>
              <input
                type="checkbox"
                checked={settings.includeNeutrals}
                onChange={(e) => setSettings({ ...settings, includeNeutrals: e.target.checked })}
                className="w-4 h-4 accent-gold"
              />
            </label>

            <div className="p-3 rounded-xl bg-void/60 border border-stone-800 flex items-center justify-between">
              <span className="text-xs font-cairo text-stone-200">مؤقت النقاش (بالثواني):</span>
              <select
                value={settings.discussionTimerSeconds}
                onChange={(e) => setSettings({ ...settings, discussionTimerSeconds: Number(e.target.value) })}
                className="bg-stone-900 border border-stone-700 text-gold text-xs rounded px-2 py-1"
              >
                <option value={30}>30 ثانية</option>
                <option value={60}>60 ثانية</option>
                <option value={90}>90 ثانية</option>
                <option value={120}>120 ثانية</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Players List Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-cairo text-stone-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            اللاعبون المُنضمون ({playerCount} / 20)
          </h3>

          {playerCount < 5 && (
            <span className="text-xs text-amber-400 font-cairo flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              يلزم 5 لاعبين على الأقل لبدء اللعبة
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roomState.players.map((p) => (
            <PlayerCard key={p.id} player={p} showRoleRevealed={false} />
          ))}
        </div>
      </div>

      {/* Start Game Action Footer */}
      {isHost && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full max-w-md py-4 rounded-2xl font-bold font-kufi text-lg flex items-center justify-center gap-3 transition-all ${
              canStart
                ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void shadow-gold-glow hover:scale-[1.02]'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            بدء اللعبة الان
          </button>
        </div>
      )}
    </div>
  );
};
