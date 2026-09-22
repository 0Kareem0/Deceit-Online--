import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundManager, SoundEffect, MusicTrack } from '../services/soundManager';
import { GameStatus } from '@deceit/shared';

interface SoundContextType {
  isMuted: boolean;
  isMusicMuted: boolean;
  toggleMute: () => void;
  toggleMusic: () => void;
  playSfx: (effect: SoundEffect, volume?: number) => void;
  updateBgmForStatus: (status: GameStatus | 'LOBBY' | 'HOME') => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    const musicMuted = soundManager.toggleMusic();
    setIsMusicMuted(musicMuted);
  };

  const playSfx = (effect: SoundEffect, volume?: number) => {
    soundManager.playSfx(effect, volume);
  };

  const updateBgmForStatus = (status: GameStatus | 'LOBBY' | 'HOME') => {
    switch (status) {
      case 'HOME':
      case 'LOBBY':
      case GameStatus.notStarted:
      case GameStatus.inLobby:
        soundManager.playMusic('home', 0.25);
        break;

      case GameStatus.inRoleReveal:
      case GameStatus.inMatchIntro:
        soundManager.playMusic('reveal', 0.35);
        break;

      case GameStatus.inNight:
        soundManager.playMusic('night', 0.35);
        break;

      case GameStatus.inMorning:
      case GameStatus.inDiscussion:
      case GameStatus.inVoting:
      case GameStatus.inDayPowers:
      case GameStatus.inElimination:
        soundManager.playMusic('discussion', 0.3);
        break;

      case GameStatus.inGameOver:
        soundManager.playMusic('victory', 0.4);
        break;

      default:
        break;
    }
  };

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        isMusicMuted,
        toggleMute: handleToggleMute,
        toggleMusic: handleToggleMusic,
        playSfx,
        updateBgmForStatus,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
