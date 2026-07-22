import { WebSocketMessage } from '../types/market';

export function parseWebSocketMessage(rawData: string): WebSocketMessage | null {
  try {
    const parsed = JSON.parse(rawData);
    if (parsed && typeof parsed.type === 'string') {
      return parsed as WebSocketMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The backend provides a multiplier (e.g., '1.0123' for +1.23%).
 * This function calculates the actual percentage change.
 */
export function calculatePercentageChange(multiplierStr: string): number {
  const multiplier = parseFloat(multiplierStr);
  if (isNaN(multiplier)) return 0;
  return (multiplier - 1) * 100;
}

export function getTradeSide(buyerRole: 'maker' | 'taker'): 'buy' | 'sell' {
  // In crypto, if the buyer is the taker, it's a market buy order lifting the ask.
  return buyerRole === 'taker' ? 'buy' : 'sell';
}
