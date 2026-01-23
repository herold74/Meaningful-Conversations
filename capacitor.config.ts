import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.manualmode.mc',
  appName: 'Meaningful Conversations',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#0f172a',
    scrollEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a'
    }
  }
};

export default config;
