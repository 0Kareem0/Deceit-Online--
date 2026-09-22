import React, { useState } from 'react';
import { ALL_ROLES } from '../data/rolesData';
import { RoleCard } from '../components/RoleCard';
import { Role, Faction } from '@deceit/shared';
import { Search, Shield, Moon, UserCheck, X, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { useSound } from '../context/SoundContext';

interface RoleCodexProps {
  onBack?: () => void;
}

export const RoleCodex: React.FC<RoleCodexProps> = ({ onBack }) => {
  const { playSfx } = useSound();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeFaction, setActiveFaction] = useState<'all' | Faction>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = ALL_ROLES.filter((role) => {
    const matchesFaction = activeFaction === 'all' || role.faction === activeFaction;
    const matchesSearch =
      role.name.includes(searchQuery) ||
      role.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.includes(searchQuery);
    return matchesFaction && matchesSearch;
  });

  const getFactionBadge = (f: Faction) => {
    switch (f) {
      case Faction.kingdom:
        return { label: 'المملكة', bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' };
      case Faction.shadow:
        return { label: 'الظلال', bg: 'bg-red-950/80 border-red-500/40 text-red-300' };
      case Faction.neutral:
        return { label: 'محايد', bg: 'bg-purple-950/80 border-purple-500/40 text-purple-300' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 select-none">
      {/* Header Banner */}
      <div className="glass-panel border-2 border-gold/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-void to-stone-900 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gold/10 border border-gold/40 rounded-2xl text-gold shadow-gold-glow">
            <Crown className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold font-kufi gold-gradient-text">معرض البطاقات والأدوار</h2>
            <p className="text-xs text-stone-300 font-cairo mt-1">
              موسوعة شريفة تضم جميع أدوار المملكة والظلال وشخصياتها (23 بطاقة)
            </p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={() => {
              playSfx('click');
              onBack();
            }}
            className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:border-gold hover:text-gold text-xs font-cairo font-bold flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </button>
        )}
      </div>

      {/* Controls Bar: Search & Faction Filters */}
      <div className="glass-panel border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-950/80">
        {/* Faction Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto font-cairo text-xs font-bold">
          <button
            onClick={() => {
              playSfx('click');
              setActiveFaction('all');
            }}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeFaction === 'all'
                ? 'bg-gold/20 border-gold text-gold shadow-gold-glow'
                : 'border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            جميع البطاقات ({ALL_ROLES.length})
          </button>
          <button
            onClick={() => {
              playSfx('click');
              setActiveFaction(Faction.kingdom);
            }}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeFaction === Faction.kingdom
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(46,125,50,0.3)]'
                : 'border-stone-800 text-stone-400 hover:text-emerald-400'
            }`}
          >
            👑 فريق المملكة ({ALL_ROLES.filter((r) => r.faction === Faction.kingdom).length})
          </button>
          <button
            onClick={() => {
              playSfx('click');
              setActiveFaction(Faction.shadow);
            }}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeFaction === Faction.shadow
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_15px_rgba(183,28,28,0.3)]'
                : 'border-stone-800 text-stone-400 hover:text-red-400'
            }`}
          >
            🌑 فريق الظلال ({ALL_ROLES.filter((r) => r.faction === Faction.shadow).length})
          </button>
          <button
            onClick={() => {
              playSfx('click');
              setActiveFaction(Faction.neutral);
            }}
            className={`px-4 py-2 rounded-xl border transition-all ${
              activeFaction === Faction.neutral
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(106,27,154,0.3)]'
                : 'border-stone-800 text-stone-400 hover:text-purple-400'
            }`}
          >
            🃏 المحايدون ({ALL_ROLES.filter((r) => r.faction === Faction.neutral).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن بطاقة دور..."
            className="w-full bg-void/90 border border-stone-700 rounded-xl pr-10 pl-4 py-2 text-stone-100 font-cairo text-xs focus:outline-none focus:border-gold transition-colors text-right"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRoles.map((r) => {
          const badge = getFactionBadge(r.faction);
          return (
            <div
              key={r.id}
              onClick={() => {
                playSfx('flip', 0.6);
                setSelectedRole(r);
              }}
              className="glass-panel border-2 border-stone-800 hover:border-gold/60 rounded-2xl p-4 flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-gradient-to-b from-stone-900/90 to-void"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold font-cairo ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xl group-hover:scale-125 transition-transform">{r.icon}</span>
                </div>

                {/* Card Artwork Thumbnail */}
                {r.cardImage && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gold/30 mb-3 bg-stone-950">
                    <img
                      src={r.cardImage}
                      alt={r.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60" />
                  </div>
                )}

                <h3 className="text-lg font-bold font-kufi text-stone-100 group-hover:text-gold transition-colors">
                  {r.name}
                </h3>
                <span className="text-[10px] font-cinzel text-stone-400 block mb-2">{r.nameEn}</span>
                <p className="text-xs text-stone-300 font-cairo line-clamp-2 leading-relaxed">{r.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-cairo text-gold">
                <span>انقر لقراءة التفاصيل 📜</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Details Modal View */}
      {selectedRole && (
        <div
          onClick={() => setSelectedRole(null)}
          className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto my-auto p-2"
          >
            <div className="flex justify-between items-center mb-2 px-2 sticky top-0 z-20">
              <span className="text-xs font-cairo font-bold text-gold bg-stone-900/90 px-3 py-1 rounded-full border border-gold/30">
                بطاقة الدور التفصيلية 📜
              </span>
              <button
                onClick={() => setSelectedRole(null)}
                className="p-2 rounded-full glass-panel border border-gold/40 text-gold hover:bg-gold hover:text-void transition-all bg-stone-900/90 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RoleCard role={selectedRole} initiallyRevealed={true} />
          </div>
        </div>
      )}
    </div>
  );
};
