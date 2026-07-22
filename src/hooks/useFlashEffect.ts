import { useEffect, useRef } from 'react';

/**
 * High-performance direct-DOM manipulation for flash states.
 * Avoids triggering heavy React re-renders on rapid data updates.
 */
export function useFlashEffect(size: number) {
  const ref = useRef<HTMLDivElement>(null);
  const prevSizeRef = useRef(size);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const currentSize = size;
    const prevSize = prevSizeRef.current;
    
    if (currentSize !== prevSize) {
      const isIncrease = currentSize > prevSize;
      const flashClass = isIncrease ? 'flash-green' : 'flash-red';
      
      // Remove classes to reset animation if it's already playing
      el.classList.remove('flash-green', 'flash-red');
      
      // Force a reflow to restart the CSS animation
      void el.offsetWidth; 
      
      el.classList.add(flashClass);
      
      const timer = setTimeout(() => {
        if (ref.current) {
          ref.current.classList.remove(flashClass);
        }
      }, 300);

      prevSizeRef.current = currentSize;

      return () => clearTimeout(timer);
    }
  }, [size]);

  return ref;
}
