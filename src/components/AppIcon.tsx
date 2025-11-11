'use client';

import { useEffect, useState } from 'react';

interface AppIconProps {
  className?: string;
  alt?: string;
}

export default function AppIcon({ className = "w-6 h-6", alt = "Voca" }: AppIconProps) {
  const [iconSrc, setIconSrc] = useState('/favicon.ico');
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor (mobile app)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsCapacitor(true);
      // In mobile app, use the app icon from public folder
      // We'll copy voca.png to the public folder for mobile use
      setIconSrc('/voca-icon.png');
    }
  }, []);

  return (
    <img
      src={iconSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        // Fallback to favicon if voca-icon.png doesn't exist
        if (isCapacitor && iconSrc === '/voca-icon.png') {
          setIconSrc('/favicon.ico');
        }
      }}
    />
  );
}