import { create } from 'zustand';
import { TradeMessage } from '../types/market';
import { ProcessedTrade, isBuyTrade, isLargeTrade } from '../utils/trades';

interface TradesState {
  rawTradesQueue: { size: number; timestamp: number }[];
  aggregatedTrades: ProcessedTrade[];
  volume1m: number;
  trades1m: number;

  addTrade: (msg: TradeMessage) => void;
  pruneOldTrades: () => void;
  reset: () => void;
}

export const useTradesStore = create<TradesState>((set) => ({
  rawTradesQueue: [],
  aggregatedTrades: [],
  volume1m: 0,
  trades1m: 0,

  addTrade: (msg: TradeMessage) => {
    const tsMs = Math.floor(msg.timestamp / 1000); // Microseconds to ms
    const price = parseFloat(msg.price);
    const size = msg.size;
    const isBuy = isBuyTrade(msg.buyer_role);

    set((state) => {
      // 1. Manage Raw Queue & Rolling Stats
      const newQueue = [...state.rawTradesQueue, { size, timestamp: tsMs }];
      const newVolume = state.volume1m + size;
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
          volume1m: newVolume - (dropped?.size || 0),
          trades1m: newTradesCount - 1,
        };
      }

      return {
        rawTradesQueue: newQueue,
        aggregatedTrades: agg,
        volume1m: newVolume,
        trades1m: newTradesCount,
      };
    });
  },

  pruneOldTrades: () => {
    const now = Date.now();
    const threshold = now - 60000; // 60 seconds ago

    set((state) => {
      let droppedVolume = 0;
      let dropCount = 0;
      const q = state.rawTradesQueue;
      
      while (dropCount < q.length && q[dropCount].timestamp < threshold) {
        droppedVolume += q[dropCount].size;
        dropCount++;
      }

      if (dropCount > 0) {
        return {
          rawTradesQueue: q.slice(dropCount),
          volume1m: state.volume1m - droppedVolume,
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
      volume1m: 0,
      trades1m: 0,
    });
  }
}));
