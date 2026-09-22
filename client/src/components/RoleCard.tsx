import React, { useState } from 'react';
import { Role, Faction } from '@deceit/shared';
import { Shield, Eye, Crown, AlertTriangle, Sparkles } from 'lucide-react';
import { soundManager } from '../services/soundManager';

interface RoleCardProps {
  role: Role;
  faction?: Faction;
  initiallyRevealed?: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, faction, initiallyRevealed = false }) => {
  const [isFlipped, setIsFlipped] = useState(initiallyRevealed);

  const handleFlip = () => {
    soundManager.playSfx('flip', 0.6);
    setIsFlipped(!isFlipped);
  };

  const getFactionColors = (f: Faction = Faction.kingdom) => {
    switch (f) {
      case Faction.kingdom:
        return {
          bg: 'from-emerald-950 via-stone-900 to-emerald-950',
          border: 'border-emerald-500/50',
          glow: 'shadow-[0_0_40px_rgba(46,125,50,0.4)]',
          badgeBg: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40',
          title: 'text-emerald-400',
          label: 'المملكة (Kingdom)',
        };
      case Faction.shadow:
        return {
          bg: 'from-red-950 via-stone-900 to-red-950',
          border: 'border-red-500/50',
          glow: 'shadow-[0_0_40px_rgba(183,28,28,0.4)]',
          badgeBg: 'bg-red-900/80 text-red-200 border-red-500/40',
          title: 'text-red-400',
          label: 'الظلال (Shadows)',
        };
      case Faction.neutral:
        return {
          bg: 'from-purple-950 via-stone-900 to-purple-950',
          border: 'border-purple-500/50',
          glow: 'shadow-[0_0_40px_rgba(106,27,154,0.4)]',
          badgeBg: 'bg-purple-900/80 text-purple-200 border-purple-500/40',
          title: 'text-purple-400',
          label: 'محايد (Neutral)',
        };
    }
  };

  const style = getFactionColors(faction || role.faction);

  return (
    <div className="w-full max-w-xl mx-auto my-4 perspective-1000 select-none">
      <div
        onClick={handleFlip}
        className={`relative w-full min-h-[660px] rounded-3xl transition-transform duration-700 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* CARD FRONT (Card Back Artwork - Hidden State) */}
        <div className="absolute inset-0 w-full h-full rounded-3xl glass-panel border-2 border-gold/50 p-8 flex flex-col items-center justify-between backface-hidden shadow-[0_0_50px_rgba(212,175,55,0.25)] bg-gradient-to-b from-stone-900 via-stone-950 to-void">
          <div className="w-full text-center space-y-2">
            <div className="inline-block p-2.5 rounded-full bg-gold/10 border border-gold/40 mb-1">
              <Crown className="w-9 h-9 text-gold animate-pulse" />
            </div>
            <h3 className="text-3xl font-kufi font-extrabold gold-gradient-text tracking-wider">ديسيت — DECEIT</h3>
            <p className="text-xs text-stone-300 font-cairo">انقر على البطاقة لكشف هويتك السرية</p>
          </div>

          <div className="relative w-48 h-48 rounded-2xl border-2 border-gold/50 overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.3)] my-4 group">
            <img src="/logo.jpg" alt="Deceit Emblem" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gold/80 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-stone-300 text-xs font-cairo bg-stone-900/90 px-5 py-2.5 rounded-full border border-gold/30 shadow-md">
            <Eye className="w-4 h-4 text-gold" />
            <span>سرّي للغاية — احرص على ألا يرى أحد شاشتك</span>
          </div>
        </div>

        {/* CARD BACK (Role Secrets & Full Artwork Revealed) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b ${style.bg} border-2 ${style.border} ${style.glow} p-6 flex flex-col justify-between backface-hidden rotate-y-180 overflow-y-auto`}
        >
          <div>
            {/* Header / Faction Badge */}
            <div className="flex items-center justify-between mb-3 border-b border-stone-800/80 pb-3">
              <span className={`text-xs px-3.5 py-1.5 rounded-full border font-bold ${style.badgeBg}`}>
                {style.label}
              </span>
              <span className="text-4xl">{role.icon}</span>
            </div>

            {/* Role Title */}
            <div className="text-center my-2">
              <h2 className={`text-4xl font-kufi font-extrabold ${style.title} drop-shadow-md`}>{role.name}</h2>
              <span className="text-xs font-cinzel text-stone-400 uppercase tracking-widest block mt-0.5">{role.nameEn}</span>
            </div>

            {/* Role Card Full PNG Artwork Display */}
            {role.cardImage && (
              <div className="relative w-full h-72 my-4 rounded-2xl overflow-hidden border-2 border-gold/50 shadow-2xl bg-stone-950 group">
                <img
                  src={role.cardImage}
                  alt={role.name}
                  className="w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* Lore */}
            <p className="text-sm font-amiri italic text-stone-200 text-center my-3 border-y border-stone-800 py-2.5 leading-relaxed bg-void/30 rounded-lg px-2">
              "{role.lore}"
            </p>

            {/* Goal */}
            <div className="mb-3 bg-void/70 p-3.5 rounded-xl border border-stone-800 shadow-inner">
              <span className="text-xs text-gold font-bold block mb-1">الهدف الشرعي:</span>
              <p className="text-xs text-stone-200 leading-relaxed">{role.goal}</p>
            </div>

            {/* Ability Description */}
            {role.abilityDescription && (
              <div className="mb-3 bg-void/70 p-3.5 rounded-xl border border-stone-800 shadow-inner">
                <span className="text-xs text-gold font-bold block mb-1">القدرة الخاصة:</span>
                <p className="text-xs text-stone-200 leading-relaxed">{role.abilityDescription}</p>
              </div>
            )}

            {/* Constraints */}
            {role.constraints && role.constraints.length > 0 && (
              <div className="bg-void/70 p-3.5 rounded-xl border border-stone-800 shadow-inner">
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  القواعد والقيود:
                </span>
                <ul className="list-disc list-inside text-xs text-stone-300 space-y-1">
                  {role.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 text-center">
            <span className="text-xs text-stone-400 font-cairo">انقر في أي مكان لإخفاء بطاقة دورك</span>
          </div>
        </div>
      </div>
    </div>
  );
};
