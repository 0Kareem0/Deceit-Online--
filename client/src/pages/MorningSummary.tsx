import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { Timer } from '../components/Timer';
import { Sun, MessageSquare, Skull, ShieldCheck, Moon } from 'lucide-react';
import { EliminationCause } from '@deceit/shared';

export const MorningSummary: React.FC = () => {
  const { publicState, proceedPhase } = useSocket();
  const { playSfx } = useSound();

  useEffect(() => {
    playSfx('rooster', 0.5);
  }, []);

  if (!publicState) return null;

  const nightCasualties = publicState.players.filter(
    (p) => !p.isAlive && (p.eliminationCause === EliminationCause.killed || p.eliminationCause === EliminationCause.poisoned)
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel border-2 border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-900/40 border border-amber-500/40 rounded-2xl text-amber-400">
            <Sun className="w-8 h-8 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-kufi text-amber-200">
              ملخص الصباح — اليوم {publicState.dayNumber || 1}
            </h2>
            <p className="text-xs text-stone-300 font-cairo mt-1">
              أشرقت الشمس فوق قلعة المملكة الكبرى... إليك ما انجلت عنه الليلة
            </p>
          </div>
        </div>

        <Timer phaseEndsAt={publicState.phaseEndsAt} label="انتقال للنقاش" />
      </div>

      {/* Night Casualties Banner */}
      <div className="glass-panel border-2 border-red-500/30 rounded-2xl p-5 space-y-3 bg-stone-950/80">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h3 className="text-sm font-bold font-kufi text-red-400 flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-500" />
            تقرير قتلى وضحايا الليلة:
          </h3>
          <span className="text-xs text-stone-400 font-cairo">
            {nightCasualties.length > 0 ? `${nightCasualties.length} قتيل` : 'ليلة آمنة'}
          </span>
        </div>

        {nightCasualties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nightCasualties.map((victim) => (
              <div
                key={victim.id}
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-between shadow-md"
              >
                <div>
                  <span className="text-base font-bold font-kufi text-red-200 block">{victim.name}</span>
                  <span className="text-[11px] text-red-400 font-cairo">
                    {victim.eliminationCause === EliminationCause.poisoned ? '☠️ مات مسموماً' : '🗡️ قُتل في ظلمات الليل'}
                  </span>
                </div>
                {victim.roleRevealed && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 border border-gold/40 text-gold font-cairo font-bold">
                    {victim.roleRevealed.icon} {victim.roleRevealed.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-cairo">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>لم يُقتل أحد في هذه الليلة! مرت بسلام ونعم الجميع بالأمان.</span>
          </div>
        )}
      </div>

      {/* Atmospheric Narration Card */}
      <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 space-y-4 bg-void/80 shadow-xl">
        <h3 className="text-sm font-bold font-kufi text-gold border-b border-stone-800 pb-2">
          رواية أحداث الليلة الماضية:
        </h3>

        <div className="text-base font-amiri leading-relaxed text-stone-200 whitespace-pre-line p-4 rounded-xl bg-stone-950/60 border border-stone-800/80">
          {publicState.narration || 'انقضت الليلة بسلام دون أحداث يشار إليها.'}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={proceedPhase}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-base shadow-gold-glow hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          بدء مجلس النقاش والتشاور 💬
        </button>
      </div>
    </div>
  );
};
