import { create } from 'zustand';
import { OrderBookMessage } from '../types/market';
import { processCumulativeDepths, groupOrderBook, calculateMetrics, ProcessedOrderBookLevel, OrderBookMetrics } from '../utils/orderbook';

interface OrderBookState {
  bids: ProcessedOrderBookLevel[];
  asks: ProcessedOrderBookLevel[];
  metrics: OrderBookMetrics | null;
  groupTick: number;

  updateOrderBook: (msg: OrderBookMessage) => void;
  setGroupTick: (tick: number) => void;
}

export const useOrderBookStore = create<OrderBookState>((set, get) => ({
  bids: [],
  asks: [],
  metrics: null,
  groupTick: 1, // Default config, will be wired to UI later

  updateOrderBook: (msg: OrderBookMessage) => {
    const { groupTick } = get();
    
    const groupedBids = groupOrderBook(msg.bids, groupTick, false);
    const groupedAsks = groupOrderBook(msg.asks, groupTick, true);

    const { processedBids, processedAsks } = processCumulativeDepths(groupedBids, groupedAsks, 20);
    const metrics = calculateMetrics(groupedBids, groupedAsks);

    set({
      bids: processedBids,
      asks: processedAsks,
      metrics,
    });
  },

  setGroupTick: (tick: number) => {
    // Only updates the config. The next incoming snapshot will naturally apply it.
    set({ groupTick: tick });
  }
}));
