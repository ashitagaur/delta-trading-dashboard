import { create } from 'zustand';
import { SymbolId } from '../types/market';
import { WebSocketManager, ConnectionStatus } from '../services/WebSocketManager';
import { STATIC_CHANNELS } from '../constants/market';

interface MarketState {
  focusedSymbol: SymbolId;
  connectionStatus: ConnectionStatus;
  
  // Actions
  setFocusedSymbol: (symbol: SymbolId) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

const getInitialSymbol = (): SymbolId => {
  try {
    const saved = localStorage.getItem('delta_focused_symbol');
    if (saved) return saved as SymbolId;
  } catch {
    // ignore
  }
  return 'BTCUSD';
};

export const useMarketStore = create<MarketState>((set, get) => ({
  focusedSymbol: getInitialSymbol(),
  connectionStatus: 'disconnected',

  setFocusedSymbol: (symbol: SymbolId) => {
    const current = get().focusedSymbol;
    if (current === symbol) return;

    try {
      localStorage.setItem('delta_focused_symbol', symbol);
    } catch {
      // ignore
    }

    const wsManager = WebSocketManager.getInstance();
    
    STATIC_CHANNELS.forEach(channel => {
      wsManager.unsubscribe(channel, [current]);
    });

    set({ focusedSymbol: symbol });

    STATIC_CHANNELS.forEach(channel => {
      wsManager.subscribe(channel, [symbol]);
    });
  },

  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),
}));
