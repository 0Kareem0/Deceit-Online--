import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { PlayerCard } from '../components/PlayerCard';
import { IntelBanner } from '../components/IntelBanner';
import { Timer } from '../components/Timer';
import { Moon, Shield, Crosshair, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { NightAbilityKind } from '@deceit/shared';

export const NightPhase: React.FC = () => {
  const { publicState, privateState, sendNightAction, proceedPhase, playerId } = useSocket();
  const { playSfx } = useSound();
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!publicState || !privateState) return null;

  const role = privateState.role;
  const hasNightAbility = role && role.nightAbilityKind !== NightAbilityKind.none;
  const livingPlayers = publicState.players.filter((p) => p.isAlive);

  const handleSelectTarget = (targetId: string) => {
    if (submitted) return;
    playSfx('click', 0.4);

    const targetCount = role?.targetCount || 1;
    if (targetCount === 1) {
      setSelectedTargetIds([targetId]);
    } else {
      if (selectedTargetIds.includes(targetId)) {
        setSelectedTargetIds(selectedTargetIds.filter((id) => id !== targetId));
      } else if (selectedTargetIds.length < targetCount) {
        setSelectedTargetIds([...selectedTargetIds, targetId]);
      }
    }
  };

  const handleSubmitAction = () => {
    playSfx('magic', 0.6);
    sendNightAction({
      playerId: playerId || '',
      targetIds: selectedTargetIds,
    });
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Night Banner Header */}
      <div className="glass-panel border-2 border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-stone-900 to-purple-950/60 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-900/40 border border-indigo-500/40 rounded-2xl text-indigo-300">
            <Moon className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-kufi text-indigo-200">
              ليلة المملكة — الليلة {publicState.currentNight}
            </h2>
            <p className="text-xs text-stone-300 font-cairo mt-1">
              أغلقت المملكة أبوابها، واستيقظ ذوو القدرات في جنح الظلام...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer phaseEndsAt={publicState.phaseEndsAt} label="الوقت المتبقي لليلة" />
          <button
            onClick={proceedPhase}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-cairo text-xs shadow-lg transition-all"
          >
            إنهاء الليلة والانتقال للصباح 🌅
          </button>
        </div>
      </div>

      {/* Owed Private Intel Reports */}
      {privateState.owedIntel && privateState.owedIntel.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-cairo text-gold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            تقارير سرية وصلتك الليلة:
          </h3>
          {privateState.owedIntel.map((intel, idx) => (
            <IntelBanner key={idx} intel={intel} />
          ))}
        </div>
      )}

      {/* Shadow Leader Recommendation Notice */}
      {privateState.shadowRecommendation && (
        <div className="glass-panel border border-red-500/40 bg-red-950/40 p-4 rounded-xl text-red-200 text-xs font-cairo flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-red-400" />
          <span>اقتراح زعيم الظلال للاغتيال الليلة: **{privateState.shadowRecommendation}**</span>
        </div>
      )}

      {/* Role Action Form */}
      {hasNightAbility && privateState.canActTonight ? (
        <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <span className="text-xs text-gold font-bold font-kufi">قدرتك الليلية:</span>
              <h3 className="text-lg font-bold font-kufi text-stone-100 flex items-center gap-2">
                <span>{role?.icon}</span>
                <span>{role?.name}</span>
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-cairo bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
              اختر {role?.targetCount || 1} هدف
            </span>
          </div>

          <p className="text-xs text-stone-300 font-cairo bg-void/60 p-3 rounded-xl border border-stone-800">
            {role?.abilityDescription}
          </p>

          <div className="space-y-3">
            <h4 className="text-xs font-bold font-cairo text-stone-300">اللاعبون الأحياء المتاحون للاستهداف:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {livingPlayers.map((p) => {
                const isSelected = selectedTargetIds.includes(p.id);
                return (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isSelected={isSelected}
                    onSelect={() => handleSelectTarget(p.id)}
                    showRoleRevealed={false}
                    disabled={submitted}
                  />
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSubmitAction}
              disabled={selectedTargetIds.length === 0 || submitted}
              className={`px-6 py-3 rounded-xl font-bold font-kufi text-sm flex items-center gap-2 transition-all ${
                submitted
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(76,175,80,0.4)]'
                  : selectedTargetIds.length > 0
                  ? 'bg-gold text-void shadow-gold-glow hover:bg-gold-light'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
              }`}
            >
              {submitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  تم تنفيذ الحركة الليلية
                </>
              ) : (
                'تأكيد اختيار الهدف'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel border border-stone-800 rounded-2xl p-8 text-center space-y-3">
          <Lock className="w-10 h-10 text-stone-500 mx-auto" />
          <h3 className="text-lg font-bold font-kufi text-stone-300">لا تملك حركة ليلية نشطة الليلة</h3>
          <p className="text-xs text-stone-400 font-cairo">
            ابقَ متخفياً في ظلمات الليل وانتظر حتى يكتمل الصباح
          </p>
        </div>
      )}
    </div>
  );
};
