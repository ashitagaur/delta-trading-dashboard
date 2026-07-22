import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { useTickerStore } from '../store/tickerStore';
import { useOrderBookStore } from '../store/orderBookStore';
import { WebSocketManager } from '../services/WebSocketManager';
import { SUPPORTED_SYMBOLS } from '../constants/market';
import { OrderBookMessage } from '../types/market';

export function useWebSocketConnection() {
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);

  useEffect(() => {
    const wsManager = WebSocketManager.getInstance();
    const updateTicker = useTickerStore.getState().updateTicker;
    const updateOrderBook = useOrderBookStore.getState().updateOrderBook;

    wsManager.setCallbacks(
      (status) => {
        setConnectionStatus(status);
      },
      (msg) => {
        if (msg.type === 'v2/ticker') {
          updateTicker(msg);
        } else if (msg.type === 'l2_orderbook') {
          updateOrderBook(msg as OrderBookMessage);
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
