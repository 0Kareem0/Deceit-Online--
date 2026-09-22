import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { BrandLogo } from '../components/BrandLogo';
import { Crown, Users, Play, Plus, ArrowRight, ShieldCheck } from 'lucide-react';

interface HomeProps {
  onOpenCodex?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenCodex }) => {
  const { createRoom, joinRoom, error, clearError } = useSocket();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createRoom(name.trim(), gender);
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCodeInput.trim()) return;
    setLoading(true);
    await joinRoom(roomCodeInput.trim().toUpperCase(), name.trim(), gender);
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel border-2 border-gold/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <BrandLogo size="lg" />

        {error && (
          <div className="mt-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs font-cairo flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200">×</button>
          </div>
        )}

        {mode === 'menu' && (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light text-void font-bold font-kufi text-lg flex items-center justify-center gap-3 shadow-gold-glow hover:opacity-95 transition-all transform hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              إنشاء غرفة جديدة
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full py-4 px-6 rounded-2xl glass-panel border-2 border-gold/30 text-stone-100 font-bold font-kufi text-lg flex items-center justify-center gap-3 hover:border-gold hover:bg-stone-900/80 transition-all transform hover:scale-[1.02]"
            >
              <Users className="w-5 h-5 text-gold" />
              الانضمام إلى غرفة
            </button>

            {onOpenCodex && (
              <button
                onClick={onOpenCodex}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-900/90 border border-gold/40 text-gold font-bold font-kufi text-base flex items-center justify-center gap-3 hover:bg-gold/10 transition-all transform hover:scale-[1.02] shadow-md"
              >
                <Crown className="w-5 h-5 text-gold" />
                معرض البطاقات والأدوار (23 بطاقة)
              </button>
            )}

            <div className="pt-2 text-center">
              <span className="text-xs text-stone-400 font-cairo flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                نسخة جماعية محلية — (Local Multiplayer)
              </span>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gold font-cairo mb-2">اسم اللاعب:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك..."
                className="w-full bg-void/80 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 font-cairo focus:outline-none focus:border-gold transition-colors text-right"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gold font-cairo mb-2">الجنس (للصياغة اللغوية):</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 rounded-xl border font-cairo text-sm font-bold transition-all ${
                    gender === 'male' ? 'bg-gold/20 border-gold text-gold' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 rounded-xl border font-cairo text-sm font-bold transition-all ${
                    gender === 'female' ? 'bg-gold/20 border-gold text-gold' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  أنثى
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="px-4 py-3 rounded-xl border border-stone-800 text-stone-400 hover:text-stone-200 text-sm font-cairo"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-xl bg-gold text-void font-bold font-kufi text-base shadow-gold-glow hover:bg-gold-light transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الإنشاء...' : 'تأكيد وإنشاء الغرفة'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gold font-cairo mb-2">رمز الغرفة (5 أحرف):</label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="مثال: A7K92"
                className="w-full bg-void/80 border border-stone-700 rounded-xl px-4 py-3 text-gold font-mono font-bold text-center tracking-widest text-lg uppercase focus:outline-none focus:border-gold transition-colors"
                maxLength={5}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gold font-cairo mb-2">اسم اللاعب:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك..."
                className="w-full bg-void/80 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 font-cairo focus:outline-none focus:border-gold transition-colors text-right"
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gold font-cairo mb-2">الجنس:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2.5 rounded-xl border font-cairo text-sm font-bold transition-all ${
                    gender === 'male' ? 'bg-gold/20 border-gold text-gold' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2.5 rounded-xl border font-cairo text-sm font-bold transition-all ${
                    gender === 'female' ? 'bg-gold/20 border-gold text-gold' : 'border-stone-800 text-stone-400'
                  }`}
                >
                  أنثى
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="px-4 py-3 rounded-xl border border-stone-800 text-stone-400 hover:text-stone-200 text-sm font-cairo"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-xl bg-gold text-void font-bold font-kufi text-base shadow-gold-glow hover:bg-gold-light transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الانضمام...' : 'دخول الغرفة'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
