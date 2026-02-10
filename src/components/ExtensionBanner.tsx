'use client';

import { useState, useEffect } from 'react';
import { X, Chrome, Palette } from 'lucide-react';

export default function ExtensionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [browserType, setBrowserType] = useState<'chrome' | 'firefox' | null>(null);

  useEffect(() => {
    // Don't show in Capacitor (mobile app)
    if ((window as { Capacitor?: unknown }).Capacitor) {
      return;
    }

    // Check browser type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isChromeBrowser = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isFirefoxBrowser = userAgent.includes('firefox');

    if (isChromeBrowser) {
      setBrowserType('chrome');
    } else if (isFirefoxBrowser) {
      setBrowserType('firefox');
    }

    // Check if already dismissed or extension installed
    const dismissed = localStorage.getItem('extensionBannerDismissed');
    const hasExtension = document.documentElement.getAttribute('data-voca-web-extension') === 'installed';

    if ((isChromeBrowser || isFirefoxBrowser) && !dismissed && !hasExtension) {
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('extensionBannerDismissed', 'true');
  };

  const handleInstall = () => {
    if (browserType === 'chrome') {
      window.open('https://chromewebstore.google.com/detail/voca-web-vocabulary-build/ajflgkmapedegaokdcmpdepepmchfbeo', '_blank');
    } else if (browserType === 'firefox') {
      window.open('https://addons.mozilla.org/firefox/addon/voca-web/', '_blank');
    }
    handleDismiss();
  };

  if (!showBanner || !browserType) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 animate-slideIn">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {browserType === 'chrome' ? (
            <Chrome className="w-8 h-8 text-green-600 dark:text-green-400" />
          ) : (
            <Palette className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Get the {browserType === 'chrome' ? 'Chrome' : 'Firefox'} Extension
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Save words instantly while browsing any website
          </p>
          <button
            onClick={handleInstall}
            className={`px-3 py-1.5 text-white text-xs font-medium rounded transition-colors ${
              browserType === 'chrome' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            Install Extension
          </button>
        </div>
      </div>
    </div>
  );
}