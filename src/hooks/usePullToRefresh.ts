import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 70;

/** Native-style pull-to-refresh on the window scroll. Returns the current pull distance and refreshing flag. */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    const start = (e: TouchEvent) => {
      startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    };
    const move = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      pullRef.current = dy > 0 ? Math.min(dy * 0.5, 110) : 0;
      setPull(pullRef.current);
    };
    const end = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await cb.current();
        } finally {
          setRefreshing(false);
        }
      }
      pullRef.current = 0;
      setPull(0);
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, []);

  return { pull, refreshing, ready: pull >= THRESHOLD };
}
