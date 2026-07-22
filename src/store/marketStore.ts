import { create } from 'zustand';
import { SymbolId } from '../types/market';
import { SYMBOL_CONFIG } from '../constants/market';
import { WebSocketManager, ConnectionStatus } from '../services/WebSocketManager';
import { useTradesStore } from './tradesStore';
import { useOrderBookStore } from './orderBookStore';

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
    
    // Only l2_orderbook and all_trades depend on the focused symbol.
    // v2/ticker is subscribed to ALL symbols simultaneously.
    wsManager.unsubscribe('l2_orderbook', [current]);
    wsManager.unsubscribe('all_trades', [current]);

    useTradesStore.getState().reset();
    useOrderBookStore.getState().reset(SYMBOL_CONFIG[symbol].defaultGrouping);

    set({ focusedSymbol: symbol });

    wsManager.subscribe('l2_orderbook', [symbol]);
    wsManager.subscribe('all_trades', [symbol]);
  },

  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),
}));
