import { create } from 'zustand';
import { SymbolId, TickerMessage } from '../types/market';

interface TickerState {
  tickers: Partial<Record<SymbolId, TickerMessage>>;
  
  // Actions
  updateTickers: (msgs: TickerMessage[]) => void;
}

export const useTickerStore = create<TickerState>((set) => ({
  tickers: {},

  updateTickers: (msgs: TickerMessage[]) => set((state) => {
    if (msgs.length === 0) return state;
    
    const newTickers = { ...state.tickers };
    for (const msg of msgs) {
      newTickers[msg.symbol] = msg;
    }
    
    return {
      tickers: newTickers
    };
  }),
}));
