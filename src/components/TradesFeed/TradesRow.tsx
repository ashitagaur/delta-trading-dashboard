import React from 'react';
import { ProcessedTrade } from '../../utils/trades';
import { formatPrice, formatSize } from '../../utils/format';
import { SymbolId } from '../../types/market';

interface Props {
  trade: ProcessedTrade;
  symbol: SymbolId;
}

export const TradesRow = React.memo(({ trade, symbol }: Props) => {
  const priceDisplay = formatPrice(trade.price, symbol);
  const sizeDisplay = formatSize(trade.size);
  const time = new Date(trade.timestamp);
  const timeDisplay = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padStart(3, '0')}`;
  
  const countDisplay = trade.count > 1 ? ` (${trade.count})` : '';
  const finalSizeDisplay = `${sizeDisplay}${countDisplay}`;
  
  const colorClass = trade.isBuy ? 'text-green-500' : 'text-red-500';
  const borderClass = trade.isLarge ? (trade.isBuy ? 'border-l-2 border-green-500' : 'border-l-2 border-red-500') : 'border-l-2 border-transparent';

  return (
    <div className={`flex items-center justify-between py-[3px] px-2 text-[11px] font-mono hover:bg-gray-800/50 transition-colors ${borderClass}`}>
      <span className="w-1/3 text-left text-gray-500">{timeDisplay}</span>
      <span className={`w-1/3 text-center ${colorClass}`}>{priceDisplay}</span>
      <span className="w-1/3 text-right text-gray-200">{finalSizeDisplay}</span>
    </div>
  );
});
