import { OrderBookMetrics as MetricsType } from '../../utils/orderbook';
import { formatPrice } from '../../utils/format';
import { SymbolId } from '../../types/market';

interface Props {
  metrics: MetricsType | null;
  symbol: SymbolId;
}

export function OrderBookMetrics({ metrics, symbol }: Props) {
  if (!metrics) return null;

  const midPrice = formatPrice(metrics.midpoint, symbol);
  // Spread in basic points. 1 bp = 0.01%
  const bp = metrics.midpoint > 0 ? (metrics.spread / metrics.midpoint) * 10000 : 0;
  const spreadDisplay = `${metrics.spread.toFixed(1)} (${bp.toFixed(1)}bp)`;
  
  const isBidHeavy = metrics.imbalance > 1;
  const imbalanceColor = isBidHeavy ? 'text-green-500' : 'text-red-500';
  const imbalanceText = `${metrics.imbalance.toFixed(2)} ${isBidHeavy ? 'bid heavy' : 'ask heavy'}`;

  return (
    <div className="flex items-center justify-between py-2 px-2 border-y border-gray-800 bg-gray-900/30 my-1">
      <div className="flex flex-col">
        <span className="text-gray-500 text-[10px]">Mid Price</span>
        <span className="text-white font-mono font-bold text-sm">{midPrice}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-gray-500 text-[10px]">Spread</span>
        <span className="text-yellow-500 font-mono font-semibold text-xs">{spreadDisplay}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-gray-500 text-[10px]">Imbalance</span>
        <span className={`font-mono font-semibold text-xs ${imbalanceColor}`}>{imbalanceText}</span>
      </div>
    </div>
  );
}
