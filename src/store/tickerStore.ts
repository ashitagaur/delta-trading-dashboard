import { create } from 'zustand';
import { SymbolId, TickerMessage } from '../types/market';

interface TickerState {
  tickers: Partial<Record<SymbolId, TickerMessage>>;
  
  // Actions
  updateTicker: (msg: TickerMessage) => void;
}

export const useTickerStore = create<TickerState>((set) => ({
  tickers: {},

  updateTicker: (msg: TickerMessage) => set((state) => {
    // To ensure O(1) rendering isolation, we only mutate the nested object reference.
    return {
      tickers: {
        ...state.tickers,
        [msg.symbol]: msg
      }
    };
  }),
}));
