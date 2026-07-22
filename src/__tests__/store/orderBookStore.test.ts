import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderBookStore } from '../../store/orderBookStore';
import { OrderBookMessage } from '../../types/market';

describe('orderBookStore', () => {
  beforeEach(() => {
    useOrderBookStore.getState().reset(1);
  });

  const createMockSnapshot = (bids: [string, string][], asks: [string, string][]): OrderBookMessage => ({
    type: 'l2_orderbook',
    symbol: 'BTCUSD',
    bids,
    asks,
    timestamp: 1000,
  });

  it('updates orderbook with snapshot payload', () => {
    const snapshot = createMockSnapshot(
      [['50000', '1']],
      [['50001', '2']]
    );

    useOrderBookStore.getState().updateOrderBook(snapshot);
    const state = useOrderBookStore.getState();

    expect(state.bids.length).toBe(1);
    expect(state.bids[0].price).toBe(50000);
    expect(state.asks.length).toBe(1);
    expect(state.asks[0].price).toBe(50001);
  });

  it('handles grouping tick change', () => {
    const snapshot = createMockSnapshot(
      [['50000.5', '1'], ['50000.2', '2']], // Bids
      [['50001.2', '1'], ['50001.8', '1']]  // Asks
    );

    useOrderBookStore.getState().updateOrderBook(snapshot);
    // Grouping by 1
    useOrderBookStore.getState().setGroupTick(1);
    const state = useOrderBookStore.getState();

    // Bids round down: 50000.5 -> 50000, 50000.2 -> 50000. Size = 3
    expect(state.bids.length).toBe(1);
    expect(state.bids[0].price).toBe(50000);
    expect(state.bids[0].size).toBe(3);

    // Asks round up: 50001.2 -> 50002, 50001.8 -> 50002. Size = 2
    expect(state.asks.length).toBe(1);
    expect(state.asks[0].price).toBe(50002);
    expect(state.asks[0].size).toBe(2);
  });
});
