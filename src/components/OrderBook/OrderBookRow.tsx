import React from 'react';
import { ProcessedOrderBookLevel } from '../../utils/orderbook';
import { useFlashEffect } from '../../hooks/useFlashEffect';
import { formatPrice, formatSize } from '../../utils/format';
import { SymbolId } from '../../types/market';

interface OrderBookRowProps {
  level: ProcessedOrderBookLevel;
  type: 'ask' | 'bid';
  symbol: SymbolId;
}

export const OrderBookRow = React.memo(({ level, type, symbol }: OrderBookRowProps) => {
  const flashRef = useFlashEffect(level.size);
  
  const isAsk = type === 'ask';
  
  const priceDisplay = formatPrice(level.price, symbol);
  const sizeDisplay = formatSize(level.size);
  const totalDisplay = formatSize(level.cumulativeSize);

  return (
    <div 
      ref={flashRef}
      className="relative flex items-center justify-between py-[2px] px-2 text-[11px] leading-tight font-mono cursor-pointer hover:bg-gray-800/50 transition-colors"
    >
      {/* Background Depth Bar */}
      <div 
        className={`absolute top-0 bottom-0 ${isAsk ? 'right-0 depth-bar-ask' : 'left-0 depth-bar-bid'} transition-all duration-100 ease-linear`}
        style={{ width: `${level.depthPercentage}%` }}
      />
      
      {/* Content - Swapped Layout */}
      {isAsk ? (
        <>
          <span className="z-10 text-gray-400 w-1/3 text-left">{totalDisplay}</span>
          <span className="z-10 text-gray-200 w-1/3 text-center">{sizeDisplay}</span>
          <span className="z-10 text-red-500 w-1/3 text-right">{priceDisplay}</span>
        </>
      ) : (
        <>
          <span className="z-10 text-green-500 w-1/3 text-left">{priceDisplay}</span>
          <span className="z-10 text-gray-200 w-1/3 text-center">{sizeDisplay}</span>
          <span className="z-10 text-gray-400 w-1/3 text-right">{totalDisplay}</span>
        </>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.level.price === next.level.price && 
         prev.level.size === next.level.size && 
         prev.level.cumulativeSize === next.level.cumulativeSize &&
         prev.symbol === next.symbol;
});
