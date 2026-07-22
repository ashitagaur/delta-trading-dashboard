import { OrderBookLevel } from '../types/market';

export interface ProcessedOrderBookLevel {
  price: number;
  size: number;
  cumulativeSize: number;
  depthPercentage: number;
}

export interface OrderBookMetrics {
  spread: number;
  midpoint: number;
  imbalance: number; // Bid size / Ask size
}

/**
 * Groups raw order book levels into specific tick sizes.
 * Bids (isAsk = false) round down to nearest tick.
 * Asks (isAsk = true) round up to nearest tick.
 */
export function groupOrderBook(
  levels: OrderBookLevel[],
  tickSize: number,
  isAsk: boolean
): { price: number; size: number }[] {
  const grouped = new Map<number, number>();

  for (const level of levels) {
    const price = parseFloat(level[0]);
    const size = parseFloat(level[1]);
    if (isNaN(price) || isNaN(size)) continue;

    const bucketPrice = isAsk 
      ? Math.ceil(price / tickSize) * tickSize
      : Math.floor(price / tickSize) * tickSize;

    // Prevent floating point errors by fixing to 8 decimal places max
    const cleanBucketPrice = Number(bucketPrice.toFixed(8));

    grouped.set(
      cleanBucketPrice,
      (grouped.get(cleanBucketPrice) || 0) + size
    );
  }

  const result = Array.from(grouped.entries()).map(([p, s]) => ({ price: p, size: s }));
  
  if (isAsk) {
    result.sort((a, b) => a.price - b.price);
  } else {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
}

/**
 * Calculates cumulative sizes and depth percentages.
 */
export function processCumulativeDepths(
  bids: { price: number; size: number }[],
  asks: { price: number; size: number }[],
  maxLevels: number = 20
): { processedBids: ProcessedOrderBookLevel[], processedAsks: ProcessedOrderBookLevel[] } {
  const boundedBids = bids.slice(0, maxLevels);
  const boundedAsks = asks.slice(0, maxLevels);

  const processedBids: ProcessedOrderBookLevel[] = [];
  const processedAsks: ProcessedOrderBookLevel[] = [];

  let bidCumulative = 0;
  for (const b of boundedBids) {
    bidCumulative += b.size;
    processedBids.push({ ...b, cumulativeSize: bidCumulative, depthPercentage: 0 });
  }

  let askCumulative = 0;
  for (const a of boundedAsks) {
    askCumulative += a.size;
    processedAsks.push({ ...a, cumulativeSize: askCumulative, depthPercentage: 0 });
  }

  const maxCumulative = Math.max(bidCumulative, askCumulative);

  if (maxCumulative > 0) {
    for (const b of processedBids) {
      b.depthPercentage = (b.cumulativeSize / maxCumulative) * 100;
    }
    for (const a of processedAsks) {
      a.depthPercentage = (a.cumulativeSize / maxCumulative) * 100;
    }
  }

  return { processedBids, processedAsks };
}

/**
 * Calculates Spread, Midpoint, and Imbalance.
 */
export function calculateMetrics(
  bids: { price: number; size: number }[],
  asks: { price: number; size: number }[]
): OrderBookMetrics {
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;

  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const midpoint = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0;

  const totalBidSize = bids.reduce((acc, curr) => acc + curr.size, 0);
  const totalAskSize = asks.reduce((acc, curr) => acc + curr.size, 0);
  
  const imbalance = totalAskSize > 0 ? totalBidSize / totalAskSize : 1;

  return { spread, midpoint, imbalance };
}
