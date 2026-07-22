import { useMarketStore } from '../../store/marketStore';
import { useTradesStore } from '../../store/tradesStore';
import { useTradesDecay } from '../../hooks/useTradesDecay';
import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { TradesRow } from './TradesRow';
import { formatSize } from '../../utils/format';

export function TradesPanel() {
  const status = useMarketStore((state) => state.connectionStatus);
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  
  const { aggregatedTrades, volume1m, trades1m } = useTradesStore();

  useTradesDecay();

  const isReady = status === 'connected' && aggregatedTrades.length > 0;
  const avgSize = trades1m > 0 ? (volume1m / trades1m) : 0;

  return (
    <section className="w-full lg:w-[280px] xl:w-[320px] bg-bg-base flex flex-col h-full shrink-0 border-t lg:border-t-0 border-gray-800">
      {/* Header */}
      <div className="flex items-center p-3 border-b border-gray-800 shrink-0">
        <span className="text-gray-200 font-bold">Recent Trades</span>
      </div>

      {!isReady ? (
        <div className="p-4 flex-1">
          <PanelPlaceholder text={status === 'disconnected' ? 'Disconnected' : 'Waiting for trades...'} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900/30 border-b border-gray-800 shrink-0">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px]">1m Volume</span>
              <span className="text-gray-200 font-mono text-xs font-bold">{formatSize(volume1m)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-[10px]">1m Trades</span>
              <span className="text-gray-200 font-mono text-xs font-bold">{trades1m.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[10px]">Avg Size</span>
              <span className="text-gray-200 font-mono text-xs font-bold">{formatSize(avgSize)}</span>
            </div>
          </div>

          {/* Table Headers */}
          <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] border-b border-gray-800 shrink-0">
            <span className="w-1/3 text-left">Price (USD)</span>
            <span className="w-1/3 text-center">Size (BTC)</span>
            <span className="w-1/3 text-right">Time</span>
          </div>

          {/* Trades Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-1 pb-1">
            {aggregatedTrades.map((trade) => (
              <TradesRow key={trade.id} trade={trade} symbol={focusedSymbol} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
