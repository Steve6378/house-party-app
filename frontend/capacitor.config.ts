import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.yorru.app',
  appName: 'Yorru',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    }
  },
  android: {
    // Allow HTTP for local dev - remove in production
    allowMixedContent: true
  }
};

export default config;
