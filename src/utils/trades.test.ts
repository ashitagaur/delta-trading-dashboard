import { describe, it, expect } from 'vitest';
import { isBuyTrade, isLargeTrade } from './trades';

describe('trades utils', () => {
  it('identifies buy trades (buyer is taker)', () => {
    expect(isBuyTrade('taker')).toBe(true);
    expect(isBuyTrade('maker')).toBe(false);
  });

  it('identifies large trades (>= 10,000 notional)', () => {
    expect(isLargeTrade(60000, 0.1)).toBe(false); // 6,000
    expect(isLargeTrade(60000, 0.5)).toBe(true);  // 30,000
    expect(isLargeTrade(10000, 1)).toBe(true);    // 10,000
    expect(isLargeTrade(9999, 1)).toBe(false);    // 9,999
  });
});
