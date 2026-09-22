import React from 'react';
import { PrivateIntel } from '@deceit/shared';
import { Scroll, Sparkles, X } from 'lucide-react';

interface IntelBannerProps {
  intel: PrivateIntel;
  onClose?: () => void;
}

export const IntelBanner: React.FC<IntelBannerProps> = ({ intel, onClose }) => {
  return (
    <div className="w-full glass-panel border-2 border-gold/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(212,175,55,0.2)] my-4 relative bg-gradient-to-r from-stone-900 via-void to-stone-900">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-stone-400 hover:text-gold transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="p-3 bg-gold/10 border border-gold/30 rounded-xl text-gold text-2xl flex-shrink-0">
          {intel.roleIcon || '📜'}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gold font-kufi">{intel.roleName}</span>
            <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
              تقرير سري
            </span>
          </div>

          <h4 className="text-lg font-bold font-kufi text-stone-100 mb-2">{intel.title}</h4>
          <p className="text-sm font-amiri text-stone-200 leading-relaxed bg-void/60 p-3 rounded-lg border border-stone-800/80">
            {intel.body}
          </p>
        </div>
      </div>
    </div>
  );
};
