import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Reverse-domain id. Align this with your Studio App Factory convention
  // before generating the Android project. It becomes the Play applicationId
  // and cannot be changed after first publish.
  appId: 'com.studioappfactory.minesweeper',
  appName: 'Minesweeper',
  webDir: 'dist',
  android: {
    // Avoid the default white flash on cold start.
    backgroundColor: '#020617',
  },
};

export default config;
