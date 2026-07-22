import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { useTickerStore } from '../store/tickerStore';
import { WebSocketManager } from '../services/WebSocketManager';
import { SUPPORTED_SYMBOLS } from '../constants/market';

export function useWebSocketConnection() {
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);

  useEffect(() => {
    const wsManager = WebSocketManager.getInstance();
    const updateTicker = useTickerStore.getState().updateTicker;

    wsManager.setCallbacks(
      (status) => {
        setConnectionStatus(status);
      },
      (msg) => {
        if (msg.type === 'v2/ticker') {
          updateTicker(msg);
        }
      }
    );

    // Initial Subscriptions
    const initialSymbol = useMarketStore.getState().focusedSymbol;
    
    // 1. Tickers: Subscribe to ALL symbols simultaneously
    wsManager.subscribe('v2/ticker', SUPPORTED_SYMBOLS);
    
    // 2. OrderBook & Trades: Subscribe to ONLY focused symbol
    wsManager.subscribe('l2_orderbook', [initialSymbol]);
    wsManager.subscribe('all_trades', [initialSymbol]);

    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, [setConnectionStatus]);
}
