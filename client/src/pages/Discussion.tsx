import React from 'react';
import { useSocket } from '../context/SocketContext';
import { PlayerCard } from '../components/PlayerCard';
import { Timer } from '../components/Timer';
import { MessageSquare, Vote, VolumeX, ShieldAlert } from 'lucide-react';

export const Discussion: React.FC = () => {
  const { publicState, proceedPhase, privateState } = useSocket();

  if (!publicState) return null;

  const livingPlayers = publicState.players.filter((p) => p.isAlive);
  const silencedPlayers = publicState.players.filter((p) => p.isSilenced && p.isAlive);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-void to-stone-900 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gold/10 border border-gold/30 rounded-2xl text-gold">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-kufi gold-gradient-text">
              مجلس الشورى والنقاش — اليوم {publicState.dayNumber}
            </h2>
            <p className="text-xs text-stone-300 font-cairo mt-1">
              تناقشوا بحكمة واكتشفوا من يخدم المملكة ومن يسعى لإسقاطها...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer phaseEndsAt={publicState.phaseEndsAt} label="الوقت المتبقي للنقاش" />
          <button
            onClick={proceedPhase}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-sm shadow-gold-glow hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Vote className="w-4 h-4" />
            الانتقال لمرحلة التصويت 🗳️
          </button>
        </div>
      </div>

      {/* Silenced Warning Banner */}
      {silencedPlayers.length > 0 && (
        <div className="glass-panel border border-purple-500/40 bg-purple-950/30 p-4 rounded-xl text-purple-200 text-xs font-cairo flex items-center gap-3">
          <VolumeX className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <span className="font-bold font-kufi text-purple-300 block">لاعبون مكبلون بالصمت اليوم:</span>
            <span>{silencedPlayers.map((p) => p.name).join('، ')} لا يحق لهم الحديث أو المشاركة في النقاش!</span>
          </div>
        </div>
      )}

      {/* Living Players Roster */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-cairo text-stone-300">
          أعضاء المجلس الأحياء ({livingPlayers.length}):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {livingPlayers.map((p) => (
            <PlayerCard key={p.id} player={p} showRoleRevealed={false} />
          ))}
        </div>
      </div>
    </div>
  );
};
