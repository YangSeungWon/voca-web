'use client';

import { useEffect } from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check if running in Capacitor AND on mobile device
    const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isCapacitor && isMobileDevice) {
      document.body.classList.add('capacitor-app');

      // Add mobile-specific styles
      const style = document.createElement('style');
      style.id = 'capacitor-styles';
      style.innerHTML = `
        /* Root variables for safe area insets */
        :root {
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-left: env(safe-area-inset-left, 0px);
          --safe-area-right: env(safe-area-inset-right, 0px);
        }

        /* Capacitor app container */
        .capacitor-app {
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }

        /* Main content - no padding, let children handle safe area */
        .capacitor-app main {
          min-height: 100vh;
        }

        /* Bottom navigation with safe area */
        .capacitor-app nav[class*="bottom"] {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          padding-bottom: var(--safe-area-bottom);
          padding-left: var(--safe-area-left);
          padding-right: var(--safe-area-right);
        }
      `;
      document.head.appendChild(style);

      // Set proper viewport height for mobile
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', setVH);

      return () => {
        window.removeEventListener('resize', setVH);
        window.removeEventListener('orientationchange', setVH);
        document.body.classList.remove('capacitor-app');
        const styleEl = document.getElementById('capacitor-styles');
        if (styleEl) styleEl.remove();
      };
    }
  }, []);

  return <>{children}</>;
}