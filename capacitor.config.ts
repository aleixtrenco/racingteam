import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ae.wolfis.racingteam',
  appName: "Wolfi's Racing Team",
  webDir: 'dist',
  ios: { contentInset: 'never', scrollEnabled: true },
  android: { backgroundColor: '#0a0a0a' },
};

export default config;
