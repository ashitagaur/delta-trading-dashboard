import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTradesStore } from '../../store/tradesStore';
import { TradeMessage } from '../../types/market';

describe('tradesStore', () => {
  beforeEach(() => {
    useTradesStore.getState().reset();
    vi.useFakeTimers();
  });

  const createMockTrade = (
    price: string,
    size: number,
    buyer_role: 'maker' | 'taker',
    timestamp: number
  ): TradeMessage => ({
    type: 'all_trades',
    symbol: 'BTCUSD',
    product_id: 1,
    timestamp,
    price,
    size,
    buyer_role,
    seller_role: buyer_role === 'maker' ? 'taker' : 'maker',
  });

  it('aggregates trades with same price, direction, within 100ms', () => {
    const msg1 = createMockTrade('50000', 1, 'taker', 100000000); // 100,000 ms
    const msg2 = createMockTrade('50000', 2, 'taker', 100050000); // 100,050 ms (within 100ms)
    
    useTradesStore.getState().addTrades([msg1, msg2]);
    
    const state = useTradesStore.getState();
    expect(state.aggregatedTrades.length).toBe(1);
    expect(state.aggregatedTrades[0].size).toBe(3);
    expect(state.aggregatedTrades[0].count).toBe(2);
  });

  it('does not aggregate trades beyond 100ms', () => {
    const msg1 = createMockTrade('50000', 1, 'taker', 100000000); // 100,000 ms
    const msg2 = createMockTrade('50000', 2, 'taker', 100150000); // 100,150 ms (> 100ms)
    
    useTradesStore.getState().addTrades([msg1, msg2]);
    
    const state = useTradesStore.getState();
    expect(state.aggregatedTrades.length).toBe(2);
  });

  it('updates rolling stats (1m volume & trades)', () => {
    const buyMsg = createMockTrade('50000', 10, 'taker', 100000000);
    const sellMsg = createMockTrade('50000', 5, 'maker', 100050000);
    
    useTradesStore.getState().addTrades([buyMsg, sellMsg]);
    
    const state = useTradesStore.getState();
    expect(state.buyVolume1m).toBe(10);
    expect(state.sellVolume1m).toBe(5);
    expect(state.trades1m).toBe(2);
  });

  it('bounds the aggregated trades list to 50', () => {
    const trades: TradeMessage[] = [];
    for (let i = 0; i < 60; i++) {
      trades.push(createMockTrade(`${50000 + i}`, 1, 'taker', 100000 + i * 200));
    }
    
    useTradesStore.getState().addTrades(trades);
    
    const state = useTradesStore.getState();
    expect(state.aggregatedTrades.length).toBe(50);
    expect(state.aggregatedTrades[0].price).toBe(50059); // Most recent
  });

  it('drops old trades from rolling stats queue beyond 5000 limit', () => {
    const trades: TradeMessage[] = [];
    for (let i = 0; i < 5005; i++) {
      // 5005 buys of size 1
      trades.push(createMockTrade('50000', 1, 'taker', 100000 + i));
    }
    
    useTradesStore.getState().addTrades(trades);
    
    const state = useTradesStore.getState();
    expect(state.rawTradesQueue.length).toBe(5000);
    // 5 drops should deduct 5 from buyVolume and 5 from trades1m
    expect(state.buyVolume1m).toBe(5000);
    expect(state.trades1m).toBe(5000);
  });
});
