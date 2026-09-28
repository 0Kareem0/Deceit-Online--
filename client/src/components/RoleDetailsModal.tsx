import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Role, Faction } from '@deceit/shared';
import { X, Shield, AlertTriangle, Target, Zap, BookOpen, Crown, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { soundManager } from '../services/soundManager';

interface RoleDetailsModalProps {
  role: Role | null;
  onClose: () => void;
}

export const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({ role, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    soundManager.playSfx('click', 0.4);
    onClose();
  };

  useEffect(() => {
    if (!role) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [role]);

  if (!role) return null;

  const getFactionStyle = (f: Faction = role.faction) => {
    switch (f) {
      case Faction.kingdom:
        return {
          gradientBg: 'from-emerald-950 via-stone-950 to-stone-950',
          borderColor: 'border-emerald-500/50',
          glowShadow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
          badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
          titleColor: 'text-emerald-400',
          accentColor: 'text-emerald-400',
          sectionBg: 'bg-emerald-950/20 border-emerald-900/50',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: '👑 فريق المملكة',
        };
      case Faction.shadow:
        return {
          gradientBg: 'from-red-950 via-stone-950 to-stone-950',
          borderColor: 'border-red-500/50',
          glowShadow: 'shadow-[0_0_50px_rgba(239,68,68,0.25)]',
          badgeBg: 'bg-red-950/90 text-red-300 border-red-500/50',
          titleColor: 'text-red-400',
          accentColor: 'text-red-400',
          sectionBg: 'bg-red-950/20 border-red-900/50',
          iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
          label: '🌑 فريق الظلال',
        };
      case Faction.neutral:
      default:
        return {
          gradientBg: 'from-purple-950 via-stone-950 to-stone-950',
          borderColor: 'border-purple-500/50',
          glowShadow: 'shadow-[0_0_50px_rgba(168,85,247,0.25)]',
          badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-500/50',
          titleColor: 'text-purple-400',
          accentColor: 'text-purple-400',
          sectionBg: 'bg-purple-950/20 border-purple-900/50',
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          label: '🃏 الشخصيات المحايدة',
        };
    }
  };

  const style = getFactionStyle(role.faction);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      {/* Fullscreen Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity"
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[94vw] sm:w-full max-w-xl max-h-[88vh] bg-gradient-to-b ${style.gradientBg} border-2 ${style.borderColor} ${style.glowShadow} rounded-3xl p-5 sm:p-6 overflow-y-auto custom-scrollbar shadow-2xl z-10 flex flex-col dir-rtl focus:outline-none animate-modal-in`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800/80 mb-4 sticky top-0 bg-stone-950/95 backdrop-blur-md pt-1 pb-3 -mx-5 px-5 sm:-mx-6 sm:px-6 -mt-5 z-20">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl filter drop-shadow">{role.icon}</span>
            <span className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full border font-bold font-cairo shadow-sm ${style.badgeBg}`}>
              {style.label}
            </span>
          </div>

          <button
            onClick={handleClose}
            aria-label="إغلاق النافذة"
            className="p-2 rounded-full border border-stone-700/80 text-stone-400 hover:text-gold hover:border-gold/60 hover:bg-gold/10 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Name & Titles */}
        <div className="text-center mb-4">
          <h2 id="role-modal-title" className={`text-3xl sm:text-4xl font-kufi font-extrabold ${style.titleColor} tracking-wide drop-shadow-md`}>
            {role.name}
          </h2>
          <span className="text-xs sm:text-sm font-cinzel text-stone-400 uppercase tracking-widest block mt-1">
            {role.nameEn}
          </span>
        </div>

        {/* Role Card Artwork Display */}
        {role.cardImage && (
          <div className={`relative w-full h-60 sm:h-72 my-2 rounded-2xl overflow-hidden border-2 ${style.borderColor} bg-stone-950 shadow-2xl group flex-shrink-0`}>
            <img
              src={role.cardImage}
              alt={role.name}
              className="w-full h-full object-contain object-center transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Lore Quote */}
        {role.lore && (
          <blockquote className="text-xs sm:text-sm font-amiri italic text-stone-200 text-center my-3 py-3 px-4 rounded-xl border border-stone-800/80 bg-stone-900/60 leading-relaxed shadow-inner">
            "{role.lore}"
          </blockquote>
        )}

        <div className="space-y-3 my-2 font-cairo">
          {/* Role Description */}
          {role.description && (
            <div className={`p-3.5 sm:p-4 rounded-xl border ${style.sectionBg} shadow-sm`}>
              <span className={`text-xs font-bold ${style.accentColor} flex items-center gap-2 mb-1.5`}>
                <BookOpen className="w-4 h-4" />
                الوصف العام للدور:
              </span>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-cairo">
                {role.description}
              </p>
            </div>
          )}

          {/* Goal */}
          {role.goal && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-800 bg-stone-900/70 shadow-inner">
              <span className="text-xs font-bold text-gold flex items-center gap-2 mb-1.5">
                <Target className="w-4 h-4 text-gold" />
                الهدف الرئيسي:
              </span>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                {role.goal}
              </p>
            </div>
          )}

          {/* Special Ability */}
          {role.abilityDescription && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-800 bg-stone-900/70 shadow-inner">
              <span className="text-xs font-bold text-gold flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-gold" />
                القدرة الخاصة:
              </span>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                {role.abilityDescription}
              </p>
            </div>
          )}

          {/* Passive Ability */}
          {role.passiveAbility && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-800 bg-stone-900/70 shadow-inner">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                القدرة الكامنة:
              </span>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                {role.passiveAbility}
              </p>
            </div>
          )}

          {/* Rules & Constraints */}
          {role.constraints && role.constraints.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-800 bg-stone-900/70 shadow-inner">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                القواعد والقيود:
              </span>
              <ul className="list-disc list-inside text-xs sm:text-sm text-stone-300 space-y-1.5 leading-relaxed">
                {role.constraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {role.tips && role.tips.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-800/80 bg-stone-900/50 shadow-inner">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                نصائح وتوجيهات:
              </span>
              <ul className="list-disc list-inside text-xs sm:text-sm text-stone-300 space-y-1.5 leading-relaxed">
                {role.tips.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {role.warnings && role.warnings.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-red-900/40 bg-red-950/20 shadow-inner">
              <span className="text-xs font-bold text-red-400 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                تحذيرات مهمة:
              </span>
              <ul className="list-disc list-inside text-xs sm:text-sm text-stone-300 space-y-1.5 leading-relaxed">
                {role.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 text-center text-xs text-stone-400 font-cairo">
          <span>انقر خارج النافذة أو اضغط على ESC للإغلاق</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
