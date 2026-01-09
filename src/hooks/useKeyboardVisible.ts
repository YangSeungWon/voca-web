import { useState, useEffect } from 'react';

interface KeyboardState {
  isVisible: boolean;
  viewportHeight: number;
}

export function useKeyboardVisible(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const initialHeight = window.innerHeight;

    const updateState = (isVisible: boolean, height?: number) => {
      setState({
        isVisible,
        viewportHeight: height ?? (window.visualViewport?.height || window.innerHeight)
      });
    };

    const handleResize = () => {
      const heightDiff = initialHeight - window.innerHeight;
      updateState(heightDiff > 150);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          updateState(true, window.visualViewport?.height || window.innerHeight);
        }, 100);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
            updateState(false, window.innerHeight);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    if (window.visualViewport) {
      const handleViewportResize = () => {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = window.innerHeight - viewportHeight;
        updateState(heightDiff > 150, viewportHeight);
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

  return state;
}
