import { useMarketStore } from '../../store/marketStore';
import { SUPPORTED_SYMBOLS } from '../../constants/market';
import { SymbolId } from '../../types/market';
import { ConnectionStatusIndicator } from '../Shared/ConnectionStatusIndicator';

export function TickerBar() {
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  const setFocusedSymbol = useMarketStore((state) => state.setFocusedSymbol);

  return (
    <header className="h-[60px] border-b border-gray-800 bg-bg-panel shrink-0 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <select
          value={focusedSymbol}
          onChange={(e) => setFocusedSymbol(e.target.value as SymbolId)}
          className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 outline-none focus:border-blue-500 font-semibold"
        >
          {SUPPORTED_SYMBOLS.map(sym => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
        <div className="text-text-muted font-semibold tracking-wider text-sm hidden sm:block">
          TICKER BAR
        </div>
      </div>
      
      <ConnectionStatusIndicator />
    </header>
  );
}
