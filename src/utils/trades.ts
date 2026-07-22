export interface ProcessedTrade {
  id: string; // unique identifier
  price: number;
  size: number;
  isBuy: boolean;
  isLarge: boolean;
  timestamp: number; // ms
  count: number; // For aggregation e.g. 1.234 (5)
}

export function isBuyTrade(buyer_role: string): boolean {
  return buyer_role === 'taker';
}

export function isLargeTrade(price: number, size: number): boolean {
  return (price * size) >= 10000;
}
