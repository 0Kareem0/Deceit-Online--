import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { soundManager } from '../services/soundManager';

interface TimerProps {
  phaseEndsAt?: number;
  label?: string;
  className?: string;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  phaseEndsAt,
  label = 'الوقت المتبقي',
  className = '',
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const prevSecondsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!phaseEndsAt) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
      setSecondsLeft((prev) => {
        if (remaining !== prev && remaining <= 10 && remaining > 0) {
          soundManager.playSfx('tick', 0.5);
        }
        return remaining;
      });

      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    return () => clearInterval(interval);
  }, [phaseEndsAt, onExpire]);

  if (!phaseEndsAt) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = secondsLeft <= 10;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border transition-all duration-300 ${
        isUrgent
          ? 'border-red-500/80 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse text-red-400'
          : 'border-gold/30 bg-stone-900/60 text-gold shadow-lg'
      } ${className}`}
    >
      {isUrgent ? (
        <AlertCircle className="w-5 h-5 text-red-400 animate-bounce" />
      ) : (
        <Clock className="w-5 h-5 text-gold" />
      )}

      <div className="flex items-center gap-2 font-cairo">
        {label && <span className="text-xs text-stone-300 font-medium">{label}:</span>}
        <span className={`text-lg font-mono font-bold tracking-wider ${isUrgent ? 'text-red-400' : 'text-gold'}`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
