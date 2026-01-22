import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.manualmode.mc',
  appName: 'Meaningful Conversations',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e'
    }
  }
};

export default config;
