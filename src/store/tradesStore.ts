import { create } from 'zustand';
import { TradeMessage } from '../types/market';
import { ProcessedTrade, isBuyTrade, isLargeTrade } from '../utils/trades';

interface TradesState {
  rawTradesQueue: { size: number; timestamp: number; isBuy: boolean }[];
  aggregatedTrades: ProcessedTrade[];
  buyVolume1m: number;
  sellVolume1m: number;
  trades1m: number;

  addTrade: (msg: TradeMessage) => void;
  pruneOldTrades: () => void;
  reset: () => void;
}

export const useTradesStore = create<TradesState>((set) => ({
  rawTradesQueue: [],
  aggregatedTrades: [],
  buyVolume1m: 0,
  sellVolume1m: 0,
  trades1m: 0,

  addTrade: (msg: TradeMessage) => {
    const tsMs = Math.floor(msg.timestamp / 1000); 
    const price = parseFloat(msg.price);
    const size = msg.size;
    const isBuy = isBuyTrade(msg.buyer_role);

    set((state) => {
      // 1. Manage Raw Queue & Rolling Stats
      const newQueue = [...state.rawTradesQueue, { size, timestamp: tsMs, isBuy }];
      const newBuyVolume = state.buyVolume1m + (isBuy ? size : 0);
      const newSellVolume = state.sellVolume1m + (!isBuy ? size : 0);
      const newTradesCount = state.trades1m + 1;

      // 2. Aggregation Logic
      const agg = [...state.aggregatedTrades];
      let newlyAggregated = false;

      if (agg.length > 0) {
        const last = agg[0]; 
        const timeDiff = tsMs - last.timestamp;
        
        // Same price, same direction, within 100ms
        if (last.price === price && last.isBuy === isBuy && timeDiff <= 100) {
          last.size += size;
          last.count += 1;
          last.isLarge = isLargeTrade(last.price, last.size);
          newlyAggregated = true;
        }
      }

      if (!newlyAggregated) {
        agg.unshift({
          id: `${msg.product_id}-${msg.timestamp}`,
          price,
          size,
          isBuy,
          isLarge: isLargeTrade(price, size),
          timestamp: tsMs,
          count: 1
        });
      }

      // Bound UI trades to 50
      if (agg.length > 50) {
        agg.length = 50;
      }

      // Hard memory bound for queue
      if (newQueue.length > 5000) {
        const dropped = newQueue.shift();
        return {
          rawTradesQueue: newQueue,
          aggregatedTrades: agg,
          buyVolume1m: newBuyVolume - (dropped?.isBuy ? dropped.size : 0),
          sellVolume1m: newSellVolume - (dropped && !dropped.isBuy ? dropped.size : 0),
          trades1m: newTradesCount - 1,
        };
      }

      return {
        rawTradesQueue: newQueue,
        aggregatedTrades: agg,
        buyVolume1m: newBuyVolume,
        sellVolume1m: newSellVolume,
        trades1m: newTradesCount,
      };
    });
  },

  pruneOldTrades: () => {
    const now = Date.now();
    const threshold = now - 60000; // 60 seconds ago

    set((state) => {
      let droppedBuyVolume = 0;
      let droppedSellVolume = 0;
      let dropCount = 0;
      const q = state.rawTradesQueue;
      
      while (dropCount < q.length && q[dropCount].timestamp < threshold) {
        if (q[dropCount].isBuy) {
          droppedBuyVolume += q[dropCount].size;
        } else {
          droppedSellVolume += q[dropCount].size;
        }
        dropCount++;
      }

      if (dropCount > 0) {
        return {
          rawTradesQueue: q.slice(dropCount),
          buyVolume1m: state.buyVolume1m - droppedBuyVolume,
          sellVolume1m: state.sellVolume1m - droppedSellVolume,
          trades1m: state.trades1m - dropCount,
        };
      }

      return state; 
    });
  },

  reset: () => {
    set({
      rawTradesQueue: [],
      aggregatedTrades: [],
      buyVolume1m: 0,
      sellVolume1m: 0,
      trades1m: 0,
    });
  }
}));
