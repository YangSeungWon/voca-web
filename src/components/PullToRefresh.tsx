'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 60;
  const maxPull = 100;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].pageY;
        // Track touch start
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY) return;
      if (isRefreshing) return;
      
      currentY = e.touches[0].pageY;
      const diff = currentY - startY;
      
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const pull = Math.min(diff * 0.5, maxPull);
        setPullDistance(pull);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      
      setPullDistance(0);
      startY = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center transition-all duration-200 z-50"
          style={{ 
            height: `${pullDistance}px`,
            opacity: opacity
          }}
        >
          <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw 
              size={24} 
              style={{ transform: `rotate(${rotation}deg)` }}
              className="text-gray-600 dark:text-gray-400"
            />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}