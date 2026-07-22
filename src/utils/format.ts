import { SYMBOL_CONFIG } from '../constants/market';
import type { SymbolId } from '../types/market';

export function formatPrice(price: number | string, symbol: SymbolId): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0.00';
  const precision = SYMBOL_CONFIG[symbol]?.precision ?? 2;
  return numPrice.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function formatSize(size: number | string, decimals: number = 4): string {
  const numSize = typeof size === 'string' ? parseFloat(size) : size;
  if (isNaN(numSize)) return '0.0000';
  return numSize.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTime(timestampUs: number): string {
  const date = new Date(timestampUs / 1000); // Microseconds to milliseconds
  const pad = (n: number, width: number = 2) => n.toString().padStart(width, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}
