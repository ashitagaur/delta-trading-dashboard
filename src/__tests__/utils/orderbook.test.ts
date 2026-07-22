import { describe, it, expect } from 'vitest';
import { groupOrderBook, processCumulativeDepths, calculateMetrics } from '../../utils/orderbook';
import { OrderBookLevel } from '../../types/market';

describe('orderbook utils', () => {
  it('groups bids correctly (rounding down)', () => {
    const bids: OrderBookLevel[] = [
      ['100.5', '1'],
      ['100.2', '2'],
      ['99.8', '3'],
    ];
    
    const result = groupOrderBook(bids, 1, false);
    
    expect(result).toEqual([
      { price: 100, size: 3 },
      { price: 99, size: 3 },
    ]);
  });

  it('groups asks correctly (rounding up)', () => {
    const asks: OrderBookLevel[] = [
      ['100.5', '1'],
      ['100.2', '2'],
      ['99.8', '3'],
    ];
    
    const result = groupOrderBook(asks, 1, true);
    
    expect(result).toEqual([
      { price: 100, size: 3 },
      { price: 101, size: 3 },
    ]);
  });

  it('calculates cumulative depths correctly across truncated levels', () => {
    const bids = [
      { price: 100, size: 10 },
      { price: 99, size: 20 },
    ];
    const asks = [
      { price: 101, size: 5 },
    ];

    const { processedBids, processedAsks } = processCumulativeDepths(bids, asks, 20);

    expect(processedBids[0].cumulativeSize).toBe(10);
    expect(processedBids[0].depthPercentage).toBeCloseTo((10 / 30) * 100);
    
    expect(processedBids[1].cumulativeSize).toBe(30);
    expect(processedBids[1].depthPercentage).toBeCloseTo(100);

    expect(processedAsks[0].cumulativeSize).toBe(5);
    expect(processedAsks[0].depthPercentage).toBeCloseTo((5 / 30) * 100);
  });

  it('calculates metrics correctly', () => {
    const bids = [{ price: 100, size: 10 }];
    const asks = [{ price: 102, size: 5 }];

    const metrics = calculateMetrics(bids, asks);
    expect(metrics.spread).toBe(2);
    expect(metrics.midpoint).toBe(101);
    expect(metrics.imbalance).toBe(2); 
  });
});
