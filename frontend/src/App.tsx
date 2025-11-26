import { useEffect, useState } from 'react';
import logo from './assets/logo.png';

// Generate random stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.7 + 0.3,
    animationDelay: Math.random() * 3,
  }));
};

export function App() {
  const [stars] = useState(() => generateStars(80));

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Top-left blue gradient */}
      <div
        className="absolute top-0 left-0 w-[40%] h-[40%] opacity-40"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, transparent 60%)',
        }}
      />

      {/* Bottom-right purple gradient */}
      <div
        className="absolute bottom-0 right-0 w-[40%] h-[40%] opacity-40"
        style={{
          background: 'linear-gradient(315deg, #4a1a6b 0%, transparent 60%)',
        }}
      />

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: '3s',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <img
          src={logo}
          alt="Yorru"
          className="w-28 h-28 md:w-36 md:h-36 mb-6 rounded-2xl"
        />

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Yorru
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-base md:text-lg mb-8 text-center">
          Night Event Planning
        </p>

        {/* Coming Soon */}
        <div className="bg-white/5 backdrop-blur-sm rounded-full px-8 py-3 border border-white/10">
          <p className="text-gray-300 text-lg font-medium">
            Coming Soon
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-gray-600 text-sm">
        &copy; 2025 Yorru
      </p>
    </div>
  );
}

export default App;
