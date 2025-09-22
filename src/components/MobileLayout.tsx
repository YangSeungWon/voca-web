'use client';

import { useEffect, useState } from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsCapacitor(true);
      // Add mobile-specific class to body
      document.body.classList.add('capacitor-app');
      
      // Add mobile-specific styles
      const style = document.createElement('style');
      style.innerHTML = `
        .mobile-safe-area {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        @supports (padding: env(safe-area-inset-top)) {
          .mobile-container {
            padding-top: calc(env(safe-area-inset-top) + 1rem);
            padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
          }
        }
        
        html, body { overflow-x: hidden; width: 100%; }
        .mobile-viewport-fix { max-width: 100vw; overflow-x: hidden; }
        * { max-width: 100vw; }
        
        .capacitor-app {
          min-height: 100vh;
          min-height: -webkit-fill-available;
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

      return () => {
        window.removeEventListener('resize', setVH);
        document.body.classList.remove('capacitor-app');
      };
    }
  }, []);

  if (isCapacitor) {
    return (
      <div className="mobile-safe-area mobile-viewport-fix">
        <div className="mobile-container">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}