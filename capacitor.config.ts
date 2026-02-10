import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.ysw.voca',
  appName: 'Voca Web',
  webDir: 'out',
  server: {
    url: 'https://voca.ysw.kr',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false
  },
  backgroundColor: '#f9fafb',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1f2937',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    }
  }
};

export default config;