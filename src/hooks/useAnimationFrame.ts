import { useEffect, useRef, useCallback } from 'react';

export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== 0) {
      const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.1);
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}
