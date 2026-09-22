import React from 'react';
import { useSocket } from '../context/SocketContext';
import { RoleCard } from '../components/RoleCard';
import { Timer } from '../components/Timer';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export const RoleReveal: React.FC = () => {
  const { privateState, proceedPhase, publicState } = useSocket();

  if (!privateState?.role) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-stone-800 text-center space-y-4">
          <Lock className="w-12 h-12 text-gold mx-auto animate-bounce" />
          <h3 className="text-xl font-bold font-kufi text-stone-200">جاري توزيع الأدوار السرية...</h3>
          <p className="text-xs text-stone-400 font-cairo">يرجى الانتظار لحين اكتمال تجهيز البطاقات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <Timer phaseEndsAt={publicState?.phaseEndsAt} label="انتقال تلقائي لليلة" className="mb-2" />
        <h2 className="text-3xl font-extrabold font-kufi gold-gradient-text">هويتك السرية في اللعبة</h2>
        <p className="text-xs text-stone-400 font-cairo">
          انقر على البطاقة أدناه لإظهار دورك وأهدافك وقواعدك السرية
        </p>
      </div>

      <RoleCard role={privateState.role} faction={privateState.faction} />

      {privateState.allies && privateState.allies.length > 0 && (
        <div className="glass-panel border border-red-500/30 rounded-xl p-4 bg-red-950/20">
          <span className="text-xs font-bold text-red-400 font-kufi block mb-2">
            حلفاؤك في فريق الظلال (Shadow Allies):
          </span>
          <div className="flex flex-wrap gap-2">
            {privateState.allies.map((ally) => (
              <span
                key={ally.id}
                className="text-xs bg-red-900/60 border border-red-500/40 text-red-200 px-3 py-1 rounded-full font-cairo font-bold"
              >
                🌑 {ally.name} {ally.roleName ? `(${ally.roleName})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 text-center">
        <button
          onClick={proceedPhase}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-base shadow-gold-glow hover:scale-[1.02] transition-all"
        >
          الانتقال إلى ليلة المملكة 🌑
        </button>
      </div>
    </div>
  );
};
