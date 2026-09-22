import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { Trophy, Crown, Skull, RefreshCw, LogOut, History } from 'lucide-react';
import { Faction } from '@deceit/shared';

export const GameOver: React.FC = () => {
  const { publicState, playAgain, leaveRoom } = useSocket();
  const { playSfx } = useSound();

  useEffect(() => {
    playSfx('fanfare', 0.7);
  }, []);

  if (!publicState) return null;

  const victory = publicState.victory;

  const getVictoryStyle = () => {
    if (victory.faction === 'kingdom') {
      return {
        bg: 'from-emerald-950 via-stone-900 to-emerald-950',
        border: 'border-emerald-500/50',
        glow: 'shadow-[0_0_50px_rgba(76,175,80,0.3)]',
        title: 'انتصار فريق المملكة! (Kingdom Victory)',
        textColor: 'text-emerald-400',
        icon: <Crown className="w-16 h-16 text-emerald-400 animate-bounce" />,
      };
    } else if (victory.faction === 'shadow') {
      return {
        bg: 'from-red-950 via-stone-900 to-red-950',
        border: 'border-red-500/50',
        glow: 'shadow-[0_0_50px_rgba(244,67,54,0.3)]',
        title: 'انتصار فريق الظلال! (Shadow Victory)',
        textColor: 'text-red-400',
        icon: <Skull className="w-16 h-16 text-red-400 animate-pulse" />,
      };
    } else {
      return {
        bg: 'from-purple-950 via-stone-900 to-purple-950',
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_50px_rgba(171,71,188,0.3)]',
        title: 'فوز المخادع بمفرده! (Trickster Victory)',
        textColor: 'text-purple-400',
        icon: <Trophy className="w-16 h-16 text-purple-400 animate-bounce" />,
      };
    }
  };

  const style = getVictoryStyle();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Victory Celebration Hero Banner */}
      <div className={`rounded-3xl bg-gradient-to-b ${style.bg} border-2 ${style.border} ${style.glow} p-8 text-center space-y-4`}>
        <div className="w-24 h-24 rounded-full bg-void/60 border-2 border-stone-700 flex items-center justify-center mx-auto shadow-2xl">
          {style.icon}
        </div>

        <h1 className={`text-4xl font-extrabold font-kufi ${style.textColor}`}>
          {style.title}
        </h1>

        <p className="text-base font-amiri text-stone-200 max-w-xl mx-auto leading-relaxed bg-void/60 p-4 rounded-xl border border-stone-800">
          {victory.reason || 'انتهت المعركة بحسم مستحق!'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              playSfx('click');
              playAgain();
            }}
            className="px-6 py-3.5 rounded-2xl bg-gold text-void font-bold font-kufi text-base shadow-gold-glow hover:bg-gold-light transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            لعب جولة جديدة في اللوبي 🔄
          </button>

          <button
            onClick={() => {
              playSfx('click');
              leaveRoom();
            }}
            className="px-6 py-3.5 rounded-2xl bg-stone-900 border border-stone-700 text-stone-300 font-bold font-kufi text-base hover:border-gold hover:text-gold transition-all flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            مغادرة الغرفة والعودة للرئيسية 🏠
          </button>
        </div>
      </div>

      {/* Complete Players Role Reveal Roster */}
      <div className="glass-panel border-2 border-gold/30 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold font-kufi text-gold border-b border-stone-800 pb-2">
          كشف أدوار جميع اللاعبين بالكامل:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {publicState.players.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-xl glass-panel border border-stone-800 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold font-cairo text-stone-100">{p.name}</h4>
                <span className={`text-xs ${p.isAlive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {p.isAlive ? 'ناجٍ' : 'مستبعد'}
                </span>
              </div>

              {p.roleRevealed && (
                <div className="text-left font-kufi font-bold text-gold text-sm flex items-center gap-1.5">
                  <span>{p.roleRevealed.icon}</span>
                  <span>{p.roleRevealed.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Match Timeline Log */}
      {publicState.gameTimeline && publicState.gameTimeline.length > 0 && (
        <div className="glass-panel border border-stone-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold font-cairo text-stone-300 flex items-center gap-2">
            <History className="w-4 h-4 text-gold" />
            سجل أحداث المعركة (Timeline):
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {publicState.gameTimeline.map((ev) => (
              <div key={ev.id} className="text-xs font-cairo p-2.5 rounded-lg bg-void/60 border border-stone-800/80">
                <span className="font-bold text-gold">{ev.title}</span> — <span className="text-stone-300">{ev.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
