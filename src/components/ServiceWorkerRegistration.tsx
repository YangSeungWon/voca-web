'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let intervalId: NodeJS.Timeout | null = null;

      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);

            // Check for updates periodically
            intervalId = setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      };

      const handleControllerChange = () => {
        window.location.reload();
      };

      window.addEventListener('load', handleLoad);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Cleanup
      return () => {
        window.removeEventListener('load', handleLoad);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, []);

  return null;
}