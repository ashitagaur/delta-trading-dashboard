import { describe, it, expect } from 'vitest';
import { parseWebSocketMessage, calculatePercentageChange, getTradeSide } from './parse';

describe('parse utilities', () => {
  it('parseWebSocketMessage parses valid json', () => {
    const raw = JSON.stringify({ type: 'v2/ticker', symbol: 'BTCUSD' });
    const parsed = parseWebSocketMessage(raw);
    expect(parsed).toEqual({ type: 'v2/ticker', symbol: 'BTCUSD' });
  });

  it('parseWebSocketMessage returns null on invalid json', () => {
    expect(parseWebSocketMessage('{ invalid }')).toBeNull();
  });

  it('calculatePercentageChange converts multiplier to percentage', () => {
    expect(calculatePercentageChange('1.0123')).toBeCloseTo(1.23);
    expect(calculatePercentageChange('0.9877')).toBeCloseTo(-1.23);
    expect(calculatePercentageChange('1.0000')).toBeCloseTo(0);
  });

  it('getTradeSide extracts side from buyer_role', () => {
    expect(getTradeSide('taker')).toBe('buy');
    expect(getTradeSide('maker')).toBe('sell');
  });
});
