import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dark Ambient Radial Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-950/20 rounded-full blur-[160px] animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-950/10 rounded-full blur-[180px]" />

      {/* Floating Gold Dust Particles */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gold/60 shadow-[0_0_10px_rgba(212,175,55,0.8)] animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 12 + 8}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle Fog Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.6)_100%)]" />
    </div>
  );
};
