import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nicoabad.synapse',
  appName: 'SYNAPSE',
  webDir: 'dist',
  android: {
    backgroundColor: '#05070d',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#05070d',
      showSpinner: false,
    },
  },
};

export default config;