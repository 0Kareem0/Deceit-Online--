import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { PlayerCard } from '../components/PlayerCard';
import { Timer } from '../components/Timer';
import { Vote, CheckCircle2, AlertOctagon, Sparkles, Scale } from 'lucide-react';

export const Voting: React.FC = () => {
  const { publicState, sendVote, proceedPhase, playerId } = useSocket();
  const { playSfx } = useSound();
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  if (!publicState) return null;

  const livingPlayers = publicState.players.filter((p) => p.isAlive && p.id !== playerId);
  const me = publicState.players.find((p) => p.id === playerId);

  const runoffCandidateIds = publicState.runoffCandidates?.map((c) => c.id) || [];
  const candidatePlayers =
    publicState.runoffPending && runoffCandidateIds.length > 0
      ? publicState.players.filter((p) => p.isAlive && p.id !== playerId && runoffCandidateIds.includes(p.id))
      : publicState.players.filter((p) => p.isAlive && p.id !== playerId);

  const handleSubmitVote = () => {
    playSfx('impact', 0.6);
    sendVote({
      voterId: playerId || '',
      targetId: selectedTargetId || 'skip',
    });
    setHasVoted(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel border-2 border-red-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-red-950/60 via-stone-900 to-red-950/40 shadow-[0_0_30px_rgba(183,28,28,0.2)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-900/40 border border-red-500/40 rounded-2xl text-red-400">
            <Vote className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-kufi text-red-200">
              مرحلة التصويت السرّي {publicState.runoffPending ? '— ⚖️ جولة الإعادة (Runoff)' : ''}
            </h2>
            <p className="text-xs text-stone-300 font-cairo mt-1">
              {publicState.runoffPending
                ? 'تعادلت الأصوات! يقتصر التصويت الآن حصرياً بين المرشحين الأكثر حصولاً على الأصوات'
                : 'اختر اللاعب الذي تشك في أمره للاقتراع على استبعاده من المملكة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer phaseEndsAt={publicState.phaseEndsAt} label="الوقت المتبقي للتصويت" />
          <button
            onClick={proceedPhase}
            className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold font-cairo text-xs shadow-lg transition-all"
          >
            إغلاق التصويت وإعلان النتيجة ⚖️
          </button>
        </div>
      </div>

      {/* Runoff Indicator Banner */}
      {publicState.runoffPending && (
        <div className="glass-panel border-2 border-amber-500/60 bg-amber-950/60 p-5 rounded-2xl text-amber-200 text-xs font-cairo flex items-center gap-4 shadow-xl">
          <div className="p-2.5 bg-amber-900/60 border border-amber-500/40 rounded-xl text-amber-300">
            <Scale className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <span className="font-bold font-kufi text-amber-300 text-sm block mb-1">
              تعادل الأصوات! جولة إعادة بين:
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {publicState.runoffCandidates?.map((candidate) => (
                <span key={candidate.id} className="px-3 py-1 bg-amber-900/80 border border-amber-400/50 rounded-lg text-amber-100 font-bold font-kufi text-xs">
                  ⚖️ {candidate.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voting Candidates List */}
      {me?.isAlive ? (
        <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold font-cairo text-gold">
              {publicState.runoffPending ? 'اختر أحد المرشحين المتعادلين للحسم:' : 'اختر المرشح للاستبعاد:'}
            </h3>
            <span className="text-xs text-stone-400 font-cairo">اقتراع سري</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidatePlayers.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isSelected={selectedTargetId === p.id}
                onSelect={() => !hasVoted && setSelectedTargetId(p.id)}
                showRoleRevealed={false}
                disabled={hasVoted}
              />
            ))}
          </div>

          {/* Abstain / Skip Option */}
          <div
            onClick={() => !hasVoted && setSelectedTargetId('skip')}
            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
              selectedTargetId === 'skip'
                ? 'bg-stone-800 border-gold text-gold font-bold'
                : 'bg-void/60 border-stone-800 text-stone-400 hover:border-stone-700'
            }`}
          >
            <span className="text-xs font-cairo">امتناع عن التصويت (Skip Vote)</span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSubmitVote}
              disabled={!selectedTargetId || hasVoted}
              className={`px-6 py-3 rounded-xl font-bold font-kufi text-sm flex items-center gap-2 transition-all ${
                hasVoted
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(76,175,80,0.4)]'
                  : selectedTargetId
                  ? 'bg-gold text-void shadow-gold-glow hover:bg-gold-light'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
              }`}
            >
              {hasVoted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  تم تسجيل صوتك بنجاح
                </>
              ) : (
                'إيداع الصوت في الصندوق'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel border border-stone-800 rounded-2xl p-8 text-center space-y-2">
          <Scale className="w-10 h-10 text-stone-500 mx-auto" />
          <h3 className="text-lg font-bold font-kufi text-stone-400">أنت مستبعد من التصويت</h3>
          <p className="text-xs text-stone-500 font-cairo">تتابع مجريات الاقتراع كشاهد فقط</p>
        </div>
      )}
    </div>
  );
};
