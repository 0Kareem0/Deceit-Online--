import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { Volume2, VolumeX, Music, Users, BookOpen, Crown } from 'lucide-react';

interface NavbarProps {
  onOpenCodex?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCodex }) => {
  const { roomCode, publicState } = useSocket();
  const { isMuted, isMusicMuted, toggleMute, toggleMusic, playSfx } = useSound();

  return (
    <nav className="w-full glass-panel border-b border-gold/30 px-4 py-3 sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md shadow-xl select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Logo & Game Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-gold/60 shadow-[0_0_15px_rgba(212,175,55,0.4)] group">
            <img src="/logo.jpg" alt="Deceit Logo" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-kufi gold-gradient-text tracking-wide leading-none">
              ديسيت
            </h1>
            <span className="text-[10px] font-cinzel text-stone-400 uppercase tracking-widest block">DECEIT ONLINE</span>
          </div>
        </div>

        {/* Center: Room Code Badge (if active) */}
        {roomCode && (
          <div className="hidden sm:flex items-center gap-3 bg-stone-900/90 px-4 py-1.5 rounded-full border border-gold/30 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs text-stone-300 font-cairo">
              <span className="text-stone-400">الغرفة:</span>
              <span className="font-mono font-bold text-gold tracking-wider text-sm">{roomCode}</span>
            </div>
            {publicState && (
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-cairo border-r border-stone-800 pr-3">
                <Users className="w-3.5 h-3.5" />
                <span>{publicState.aliveCount} حي</span>
              </div>
            )}
          </div>
        )}

        {/* Right: Sound Controls & Role Codex */}
        <div className="flex items-center gap-2">
          {/* Role Codex Button */}
          {onOpenCodex && (
            <button
              onClick={() => {
                playSfx('click');
                onOpenCodex();
              }}
              title="معرض البطاقات والأدوار (23 بطاقة)"
              className="px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/40 text-gold hover:bg-gold/20 text-xs font-cairo font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">معرض البطاقات والأدوار</span>
            </button>
          )}

          {/* Music Toggle */}
          <button
            onClick={() => {
              playSfx('click');
              toggleMusic();
            }}
            title={isMusicMuted ? 'تشغيل الموسيقى' : 'إيقاف الموسيقى'}
            className={`p-2 rounded-xl border transition-all ${
              isMusicMuted
                ? 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
                : 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Master Sound SFX Toggle */}
          <button
            onClick={() => {
              playSfx('click');
              toggleMute();
            }}
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-red-950/40 border-red-500/40 text-red-400'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-gold/30 hover:text-gold'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-gold" />}
          </button>
        </div>
      </div>
    </nav>
  );
};
