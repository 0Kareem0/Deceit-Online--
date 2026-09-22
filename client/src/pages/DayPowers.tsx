import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Timer } from '../components/Timer';
import { Scale, AlertTriangle, ShieldCheck, Play } from 'lucide-react';

export const DayPowers: React.FC = () => {
  const { publicState, privateState, sendDayPower, proceedPhase } = useSocket();

  if (!publicState || !privateState) return null;

  const isJudge = privateState.role?.id === 'judge' && privateState.canActTonight !== false;
  const condemned = publicState.eliminatedPlayer;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Banner */}
      <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <Timer phaseEndsAt={publicState?.phaseEndsAt} label="مهلة الاعتراض" className="mx-auto mb-2" />
        <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mx-auto text-gold">
          <Scale className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-extrabold font-kufi gold-gradient-text">مرحلة القرارات القضائية والنهارية</h2>
        <p className="text-xs text-stone-300 font-cairo">
          انتهى التصويت وتم الاستقرار على النتيجة... يحق لـ (القاضي) الاعتراض قبل التنفيذ
        </p>

        {condemned && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 my-4 text-center">
            <span className="text-xs text-stone-400 font-cairo block mb-1">اللاعب المحكوم عليه بالاستبعاد:</span>
            <span className="text-xl font-bold font-kufi text-red-400">⚖️ {condemned.name}</span>
          </div>
        )}

        {isJudge && (
          <div className="p-5 rounded-2xl bg-gold/10 border-2 border-gold/40 space-y-3">
            <span className="text-sm font-bold font-kufi text-gold block">أنت تملك سلطة القاضي (Judge Authority)!</span>
            <p className="text-xs text-stone-300 font-cairo">
              يمكنك استخدام حق النقض (Veto) لإلغاء هذا التصويت وإنقاذ المحكوم عليه.
            </p>
            <button
              onClick={() => sendDayPower('veto')}
              className="px-6 py-3 rounded-xl bg-gold text-void font-bold font-kufi text-sm shadow-gold-glow hover:bg-gold-light transition-all"
            >
              تفعيل اعتراض القاضي (Veto) ⚖️
            </button>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={proceedPhase}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-base shadow-gold-glow hover:scale-[1.02] transition-all"
          >
            تنفيذ الحكم والحصيلة ⚡
          </button>
        </div>
      </div>
    </div>
  );
};
