import { describe, it, expect } from 'vitest';
import { useTickerStore } from './tickerStore';
import { TickerMessage } from '../types/market';

describe('tickerStore', () => {
  it('updates ticker state cleanly without removing other symbols', () => {
    const msg1: TickerMessage = {
      type: 'v2/ticker', symbol: 'BTCUSD', close: 100, open: 90, high: 110, low: 80,
      mark_price: '100', spot_price: '100', volume: 1000, turnover: 100000,
      funding_rate: '0.01', ltp_change_24h: '1.05', mark_change_24h: '1.05',
      timestamp: 12345, quotes: { best_ask: '101', best_bid: '99', ask_size: '1', bid_size: '1' }
    };

    const msg2: TickerMessage = {
      ...msg1, symbol: 'ETHUSD', close: 200
    };

    useTickerStore.getState().updateTicker(msg1);
    expect(useTickerStore.getState().tickers['BTCUSD']).toBe(msg1);

    useTickerStore.getState().updateTicker(msg2);
    expect(useTickerStore.getState().tickers['BTCUSD']).toBe(msg1);
    expect(useTickerStore.getState().tickers['ETHUSD']).toBe(msg2);
  });
});
