import { useState, useEffect } from 'react';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // For iOS/Capacitor, detect keyboard by viewport resize
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      // If height shrinks significantly (by more than 150px), keyboard is likely visible
      const heightDiff = initialHeight - window.innerHeight;
      setIsKeyboardVisible(heightDiff > 150);
    };

    // Also listen for focus/blur on input elements
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to let keyboard animation start
        setTimeout(() => {
          setIsKeyboardVisible(true);
        }, 100);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to check if focus moved to another input
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
            setIsKeyboardVisible(false);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Also check with visualViewport API if available
    if (window.visualViewport) {
      const handleViewportResize = () => {
        const heightDiff = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
        setIsKeyboardVisible(heightDiff > 150);
      };
      window.visualViewport.addEventListener('resize', handleViewportResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        window.visualViewport?.removeEventListener('resize', handleViewportResize);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardVisible;
}
