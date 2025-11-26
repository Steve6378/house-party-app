import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Complete splash after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900 to-secondary-900 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="animate-scale-in">
        <img
          src={logo}
          alt="Yorru Events Logo"
          className="w-48 h-48 object-contain animate-pulse-slow"
        />
      </div>
    </div>
  );
}

export default SplashScreen;
