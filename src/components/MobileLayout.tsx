'use client';

import { useEffect, useState } from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsCapacitor(true);
      document.body.classList.add('capacitor-app');

      // Add mobile-specific styles
      const style = document.createElement('style');
      style.innerHTML = `
        /* Root variables for safe area insets */
        :root {
          --safe-area-top: env(safe-area-inset-top, 0px);
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-left: env(safe-area-inset-left, 0px);
          --safe-area-right: env(safe-area-inset-right, 0px);
        }

        /* Prevent horizontal scroll */
        html, body {
          overflow-x: hidden;
          width: 100%;
        }

        /* Capacitor app container */
        .capacitor-app {
          min-height: 100vh;
          min-height: -webkit-fill-available;
        }

        /* Fixed header with safe area */
        .capacitor-app header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding-top: var(--safe-area-top);
          padding-left: var(--safe-area-left);
          padding-right: var(--safe-area-right);
        }

        /* Main content with proper spacing */
        .capacitor-app main {
          padding-top: calc(var(--safe-area-top) + 64px);
          padding-bottom: calc(var(--safe-area-bottom) + 80px);
          padding-left: var(--safe-area-left);
          padding-right: var(--safe-area-right);
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
      };
    }
  }, []);

  return <>{children}</>;
}