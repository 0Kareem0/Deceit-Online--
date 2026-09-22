import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', subtitle = true }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  };

  const imageSizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  return (
    <div className="flex flex-col items-center justify-center text-center select-none font-kufi">
      {/* Official Game Logo Image Emblem */}
      <div className={`relative ${imageSizes[size]} rounded-2xl overflow-hidden border-2 border-gold/60 shadow-[0_0_30px_rgba(212,175,55,0.4)] mb-3 transform hover:scale-105 transition-transform duration-500`}>
        <img src="/logo.jpg" alt="Deceit Logo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="relative inline-block">
        <h1 className={`${sizeClasses[size]} font-extrabold tracking-wider gold-gradient-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]`}>
          ديسيت
        </h1>
        <span className="block text-xs uppercase tracking-[0.35em] text-gold-light/70 font-cinzel font-bold mt-1">
          DECEIT ONLINE
        </span>
      </div>

      {subtitle && (
        <p className="mt-2 text-sm text-stone-300 font-amiri italic tracking-wide">
          "ليس كل من يبتسم حليفًا..."
        </p>
      )}
    </div>
  );
};
