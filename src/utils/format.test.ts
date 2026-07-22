import { describe, it, expect } from 'vitest';
import { formatPrice, formatSize, formatPercentage, formatTime } from './format';

describe('format utilities', () => {
  it('formatPrice respects symbol precision', () => {
    expect(formatPrice(62341.567, 'BTCUSD')).toBe('62,341.6');
    expect(formatPrice('1500.123', 'ETHUSD')).toBe('1,500.12');
    expect(formatPrice(0.0542319, 'DOGEUSD')).toBe('0.054232');
  });

  it('formatSize handles default and custom decimals', () => {
    expect(formatSize(1234.56789)).toBe('1,234.5679');
    expect(formatSize('10.5', 2)).toBe('10.5');
  });

  it('formatPercentage formats correctly with sign', () => {
    expect(formatPercentage(1.23)).toBe('+1.23%');
    expect(formatPercentage(-0.55)).toBe('-0.55%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('formatTime converts microseconds correctly', () => {
    const d = new Date('2024-01-01T14:32:05.123Z');
    const us = d.getTime() * 1000;
    const timeStr = formatTime(us);
    // Local time depends on environment, just ensure it formats hours:minutes:seconds.ms
    expect(timeStr).toMatch(/^\d{2}:\d{2}:\d{2}\.123$/);
  });
});
