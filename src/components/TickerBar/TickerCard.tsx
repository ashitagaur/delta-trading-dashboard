import { useTickerStore } from '../../store/tickerStore';
import { useMarketStore } from '../../store/marketStore';
import { SymbolId } from '../../types/market';
import { formatPrice, formatPercentage } from '../../utils/format';
import { calculatePercentageChange } from '../../utils/parse';

interface TickerCardProps {
  symbol: SymbolId;
}

export function TickerCard({ symbol }: TickerCardProps) {
  const ticker = useTickerStore((state) => state.tickers[symbol]);
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  const setFocusedSymbol = useMarketStore((state) => state.setFocusedSymbol);

  const isFocused = focusedSymbol === symbol;
  
  // Calculate display values safely
  const priceDisplay = ticker ? formatPrice(ticker.close, symbol) : '---';
  const pctChange = ticker ? calculatePercentageChange(ticker.ltp_change_24h) : 0;
  const pctDisplay = ticker ? formatPercentage(pctChange) : '0.00%';
  
  const isPositive = pctChange >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <button 
      onClick={() => setFocusedSymbol(symbol)}
      className={`
        flex flex-col justify-center min-w-[200px] p-3 border-r border-gray-800 transition-colors text-left
        ${isFocused ? 'bg-bg-base border-t-2 border-t-blue-500 pt-[10px]' : 'bg-bg-panel border-t-2 border-t-transparent hover:bg-gray-800/50'}
      `}
    >
      <div className="flex justify-between items-baseline w-full mb-1">
        <span className={`font-bold ${isFocused ? 'text-white' : 'text-gray-300'}`}>{symbol}</span>
        <span className={`font-mono font-bold tracking-tight ${isFocused ? 'text-white' : 'text-gray-300'}`}>{priceDisplay}</span>
      </div>
      
      <div className="flex justify-between items-center w-full text-xs">
        <span className="text-gray-500">Perpetual</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono font-semibold ${changeColor}`}>
            {pctDisplay}
          </span>
          {/* Simple CSS-based trend arrow */}
          <span className={`text-[10px] font-bold ${changeColor}`}>
            {isPositive ? '↗' : '↘'}
          </span>
        </div>
      </div>
    </button>
  );
}
