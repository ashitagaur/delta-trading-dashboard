import { useEffect } from 'react';
import { useTradesStore } from '../store/tradesStore';

export function useTradesDecay() {
  useEffect(() => {
    const interval = setInterval(() => {
      useTradesStore.getState().pruneOldTrades();
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}
