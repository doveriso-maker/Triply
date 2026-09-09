import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.il.mytriply.app',
  appName: 'TRIPLY',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
