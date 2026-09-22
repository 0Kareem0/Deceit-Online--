import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { Timer } from '../components/Timer';
import { Skull, Scale, Sparkles, UserX, AlertTriangle } from 'lucide-react';
import { RoleCard } from '../components/RoleCard';

export const Elimination: React.FC = () => {
  const { publicState, proceedPhase } = useSocket();
  const { playSfx } = useSound();

  const eliminated = publicState?.eliminatedPlayer;

  useEffect(() => {
    if (eliminated) {
      playSfx('bell', 0.7);
    }
  }, [eliminated?.id]);

  if (!publicState) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="glass-panel border-2 border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(183,28,28,0.25)] bg-gradient-to-b from-stone-900 via-stone-950 to-void">
        <Timer phaseEndsAt={publicState?.phaseEndsAt} label="متابعة تلقائية" className="mx-auto mb-2" />

        <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
          <Skull className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold font-kufi text-red-400 tracking-wide">
            نتيجة تصويت المجلس والتنفيذ
          </h2>
          <p className="text-xs text-stone-300 font-cairo">
            اجتمع أبناء المملكة واقتسموا الأقوال حيال من يهدد طمأنينتهم
          </p>
        </div>

        {eliminated ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-stone-950/90 border-2 border-red-500/40 shadow-xl space-y-2">
              <span className="text-xs text-stone-400 font-cairo flex items-center justify-center gap-1.5">
                <UserX className="w-4 h-4 text-red-400" />
                اللاعب الصادر بحقه حكم الاستبعاد:
              </span>
              <h3 className="text-3xl font-extrabold font-kufi text-red-300 my-1">{eliminated.name}</h3>
              <p className="text-xs text-stone-400 font-cairo">
                جرى استبعاده رسمياً من المملكة بناءً على الأغلبية في الصندوق ⚖️
              </p>
            </div>

            {eliminated.roleRevealed ? (
              <div className="pt-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/40 text-gold text-xs font-bold font-cairo shadow-md">
                  <Sparkles className="w-4 h-4" />
                  <span>بطاقة الدور المكشوف للاعب المستبعد:</span>
                </div>
                <RoleCard role={eliminated.roleRevealed} initiallyRevealed={true} />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 text-xs text-stone-400 font-cairo">
                هوية الدور السري مستورة (حسب إعدادات المباراة).
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-stone-950/90 border border-emerald-500/40 text-center space-y-2 shadow-inner">
            <Scale className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold font-kufi text-emerald-300">لم يتم استبعاد أي أحد اليوم</h3>
            <p className="text-xs text-stone-300 font-cairo">
              انتهى التصويت دون أغلبية ملزمة أو جرى إلغاء القرار من القاضي المستقل.
            </p>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={proceedPhase}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-base shadow-gold-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mx-auto"
          >
            متابعة اللعبة 🌙
          </button>
        </div>
      </div>
    </div>
  );
};
