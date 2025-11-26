import { useEffect } from 'react';
import { App } from '@capacitor/app';

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
}

interface UseBackButtonOptions {
  onBack?: () => boolean; // Return true to prevent default behavior
}

/**
 * Hook to handle Android hardware back button in Capacitor apps
 * - Navigates back in history if possible
 * - Minimizes app if at root
 */
export function useBackButton(options: UseBackButtonOptions = {}) {
  useEffect(() => {
    const win = window as CapacitorWindow;
    const isNative = win.Capacitor?.isNativePlatform?.();
    const isAndroid = win.Capacitor?.getPlatform?.() === 'android';

    if (!isNative || !isAndroid) {
      return;
    }

    const handleBackButton = async () => {
      // Allow custom handler to intercept
      if (options.onBack?.()) {
        return;
      }

      // Check if we can go back in browser history
      const hash = window.location.hash;

      // If not at home, go to home
      if (hash && hash !== '#home') {
        window.location.hash = '#home';
        return;
      }

      // At home - minimize the app (don't exit)
      await App.minimizeApp();
    };

    const listener = App.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, [options]);
}
