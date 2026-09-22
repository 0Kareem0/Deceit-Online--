import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { SoundProvider, useSound } from './context/SoundContext';
import { Navbar } from './components/Navbar';
import { ChatPanel } from './components/ChatPanel';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { RoleReveal } from './pages/RoleReveal';
import { NightPhase } from './pages/NightPhase';
import { MorningSummary } from './pages/MorningSummary';
import { Discussion } from './pages/Discussion';
import { Voting } from './pages/Voting';
import { DayPowers } from './pages/DayPowers';
import { Elimination } from './pages/Elimination';
import { GameOver } from './pages/GameOver';
import { RoleCodex } from './pages/RoleCodex';
import { GameStatus } from '@deceit/shared';

export const AppContent: React.FC<{ onOpenCodex: () => void }> = ({ onOpenCodex }) => {
  const { roomState, publicState } = useSocket();
  const { updateBgmForStatus } = useSound();

  useEffect(() => {
    if (!roomState) {
      updateBgmForStatus('HOME');
    } else if (roomState.status === 'LOBBY') {
      updateBgmForStatus('LOBBY');
    } else if (publicState) {
      updateBgmForStatus(publicState.status);
    }
  }, [roomState?.status, publicState?.status, updateBgmForStatus]);

  if (!roomState) {
    return <Home onOpenCodex={onOpenCodex} />;
  }

  if (roomState.status === 'LOBBY') {
    return <Lobby />;
  }

  if (publicState) {
    switch (publicState.status) {
      case GameStatus.inRoleReveal:
      case GameStatus.inMatchIntro:
        return <RoleReveal />;
      case GameStatus.inNight:
        return <NightPhase />;
      case GameStatus.inMorning:
        return <MorningSummary />;
      case GameStatus.inDiscussion:
        return <Discussion />;
      case GameStatus.inVoting:
        return <Voting />;
      case GameStatus.inDayPowers:
        return <DayPowers />;
      case GameStatus.inElimination:
        return <Elimination />;
      case GameStatus.inGameOver:
        return <GameOver />;
      default:
        return <Lobby />;
    }
  }

  return <Lobby />;
};

export const App: React.FC = () => {
  const [showCodex, setShowCodex] = useState(false);

  return (
    <SoundProvider>
      <div className="relative min-h-screen flex flex-col bg-void text-stone-100 selection:bg-gold selection:text-void overflow-x-hidden">
        <AnimatedBackground />
        <Navbar onOpenCodex={() => setShowCodex(true)} />
        <main className="flex-1 py-6 px-4 relative z-10">
          <AppContent onOpenCodex={() => setShowCodex(true)} />
        </main>
        <ChatPanel />

        {/* Global Role Codex Gallery Modal */}
        {showCodex && (
          <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md overflow-y-auto p-4 animate-fade-in">
            <RoleCodex onBack={() => setShowCodex(false)} />
          </div>
        )}
      </div>
    </SoundProvider>
  );
};
