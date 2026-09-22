import React from 'react';
import { PlayerPublic } from '@deceit/shared';
import { Crown, VolumeX, ShieldAlert, CheckCircle, Skull, User, Bot } from 'lucide-react';

interface PlayerCardProps {
  player: PlayerPublic;
  isSelected?: boolean;
  onSelect?: () => void;
  showRoleRevealed?: boolean;
  disabled?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected = false,
  onSelect,
  showRoleRevealed = true,
  disabled = false,
}) => {
  return (
    <div
      onClick={() => !disabled && player.isAlive && onSelect && onSelect()}
      className={`relative rounded-xl p-4 transition-all duration-300 border flex items-center justify-between ${
        !player.isAlive
          ? 'bg-stone-950/60 border-stone-800 opacity-60'
          : isSelected
          ? 'bg-gold/15 border-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02]'
          : 'glass-panel border-stone-800 hover:border-gold/40 hover:bg-stone-900/60'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg relative ${
            !player.isAlive
              ? 'border-red-900 bg-red-950/40 text-red-500'
              : player.isHost
              ? 'border-gold bg-gold/10 text-gold'
              : player.isBot
              ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
              : 'border-stone-700 bg-stone-900 text-stone-300'
          }`}
        >
          {!player.isAlive ? (
            <Skull className="w-6 h-6 text-red-500" />
          ) : player.isBot ? (
            <Bot className="w-6 h-6 text-indigo-400" />
          ) : (
            <User className="w-6 h-6" />
          )}

          {player.isHost && (
            <div className="absolute -top-1.5 -right-1 bg-gold text-void rounded-full p-0.5 shadow-md">
              <Crown className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className={`font-bold font-cairo ${!player.isAlive ? 'line-through text-stone-500' : 'text-stone-100'}`}>
              {player.name}
            </h4>
            {player.isBot && (
              <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-cairo">
                🤖 بوت
              </span>
            )}
            {player.isSilenced && player.isAlive && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                <VolumeX className="w-3 h-3" />
                مكتوم
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${player.isAlive ? 'text-emerald-400' : 'text-red-400'}`}>
              {player.isAlive ? 'على قيد الحياة' : 'استُبعد'}
            </span>

            {showRoleRevealed && player.roleRevealed && (
              <span className="text-xs text-gold font-bold font-kufi">
                — {player.roleRevealed.icon} {player.roleRevealed.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {player.isAlive && onSelect && (
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
          isSelected ? 'bg-gold border-gold text-void' : 'border-stone-700'
        }`}>
          {isSelected && <CheckCircle className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
};
