import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { useTickerStore } from '../store/tickerStore';
import { useOrderBookStore } from '../store/orderBookStore';
import { useTradesStore } from '../store/tradesStore';
import { WebSocketManager } from '../services/WebSocketManager';
import { SUPPORTED_SYMBOLS } from '../constants/market';
import { OrderBookMessage, TradeMessage, TickerMessage } from '../types/market';

export function useWebSocketConnection() {
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);

  useEffect(() => {
    const wsManager = WebSocketManager.getInstance();
    
    // --- Mutable Buffers ---
    let latestOrderBookMsg: OrderBookMessage | null = null;
    let tradesBuffer: TradeMessage[] = [];
    let tickersBuffer: TickerMessage[] = [];

    // --- Timed Flush Interval (100ms = 10 FPS) ---
    // This dramatically reduces React reconciliations and Main Thread blocking
    const flushInterval = setInterval(() => {
      // 1. Flush Order Book (Snapshot, so we only need the latest)
      if (latestOrderBookMsg) {
        useOrderBookStore.getState().updateOrderBook(latestOrderBookMsg);
        latestOrderBookMsg = null;
      }
      
      // 2. Flush Trades (Batch insert)
      if (tradesBuffer.length > 0) {
        useTradesStore.getState().addTrades(tradesBuffer);
        tradesBuffer = [];
      }
      
      // 3. Flush Tickers (Batch update)
      if (tickersBuffer.length > 0) {
        useTickerStore.getState().updateTickers(tickersBuffer);
        tickersBuffer = [];
      }
    }, 100);

    wsManager.setCallbacks(
      (status) => {
        setConnectionStatus(status);
      },
      (msg) => {
        const currentSymbol = useMarketStore.getState().focusedSymbol;

        if (msg.type === 'v2/ticker') {
          tickersBuffer.push(msg as TickerMessage);
        } else if (msg.type === 'l2_orderbook') {
          if (msg.symbol !== currentSymbol) return;
          latestOrderBookMsg = msg as OrderBookMessage; // Overwrite intermediate snapshots
        } else if (msg.type === 'all_trades') {
          if (msg.symbol !== currentSymbol) return;
          tradesBuffer.push(msg as TradeMessage);
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
      clearInterval(flushInterval); // Flawless cleanup
      wsManager.disconnect();
    };
  }, [setConnectionStatus]);
}
