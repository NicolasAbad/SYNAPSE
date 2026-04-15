import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.synapsegame.mind',
  appName: 'SYNAPSE',
  webDir: 'dist',
  backgroundColor: '#03050C',
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
    backgroundColor: '#03050C',
  },
  android: {
    backgroundColor: '#03050C',
    allowMixedContent: false,
  },
  plugins: {
    Keyboard: {
      resize: 'native',
    },
  },
};

export default config;
