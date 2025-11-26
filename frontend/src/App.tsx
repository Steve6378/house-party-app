import logo from './assets/logo.png';

export function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <img
        src={logo}
        alt="Yorru"
        className="w-32 h-32 md:w-40 md:h-40 mb-8 drop-shadow-2xl"
      />

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        Yorru
      </h1>

      {/* Tagline */}
      <p className="text-purple-300 text-lg md:text-xl mb-8 text-center">
        Night Event Planning
      </p>

      {/* Coming Soon */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
        <p className="text-white text-xl md:text-2xl font-medium">
          Coming Soon
        </p>
      </div>

      {/* Subtle footer */}
      <p className="absolute bottom-8 text-gray-500 text-sm">
        &copy; 2025 Yorru
      </p>
    </div>
  );
}

export default App;
