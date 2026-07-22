import { ConnectionStatusIndicator } from '../Shared/ConnectionStatusIndicator';
import { useMarketStore } from '../../store/marketStore';

export function GlobalHeader() {
  const focusedSymbol = useMarketStore(state => state.focusedSymbol);

  return (
    <div className="h-7 bg-black border-b border-gray-800 flex items-center justify-between px-4 shrink-0 text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <ConnectionStatusIndicator />
        <span className="text-gray-600 hidden sm:inline-block">8 channels</span>
        <span className="text-gray-600 hidden sm:inline-block">ws://localhost:8080</span>
      </div>
      <div className="text-gray-600">
        Focused: <span className="text-gray-400 font-semibold">{focusedSymbol}</span>
      </div>
    </div>
  );
}
