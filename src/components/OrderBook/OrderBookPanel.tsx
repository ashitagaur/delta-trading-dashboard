import { useOrderBookStore } from '../../store/orderBookStore';
import { useMarketStore } from '../../store/marketStore';
import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { TableShimmer } from '../Shared/TableShimmer';
import { OrderBookRow } from './OrderBookRow';
import { OrderBookMetrics } from './OrderBookMetrics';
import { SYMBOL_CONFIG } from '../../constants/market';

export function OrderBookPanel() {
  const status = useMarketStore((state) => state.connectionStatus);
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  
  const { bids, asks, metrics, groupTick, setGroupTick } = useOrderBookStore();

  const config = SYMBOL_CONFIG[focusedSymbol];
  const baseCurrency = focusedSymbol.replace('USD', '');

  const isReady = status === 'connected' && bids.length > 0 && asks.length > 0;

  // Asks are sorted ascending (lowest price first) in the store.
  // We want to render them descending so the lowest ask is at the bottom (near the spread).
  const renderAsks = [...asks].reverse();

  return (
    <section className="flex-1 w-full border-r border-gray-800 bg-[#0b0e11] flex flex-col h-full min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-200 font-bold text-sm lg:text-base whitespace-nowrap">Order Book — {focusedSymbol}</span>
          <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0">LIVE</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs mr-1 hidden sm:inline">Group:</span>
          {config.groupingOptions.map((tick) => (
            <button
              key={tick}
              onClick={() => setGroupTick(tick)}
              className={`px-1 rounded text-xs transition-colors ${
                groupTick === tick 
                  ? 'bg-[#2b313f] text-blue-400 font-bold' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tick}
            </button>
          ))}
        </div>
      </div>

      {!isReady ? (
        status === 'disconnected' ? (
          <div className="p-4 flex-1">
            <PanelPlaceholder text="Disconnected" />
          </div>
        ) : (
          <TableShimmer rowCount={40} />
        )
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Asks Table Headers */}
          <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] border-b border-gray-800 shrink-0">
            <span className="w-1/3 text-left">Total ({baseCurrency})</span>
            <span className="w-1/3 text-center">Size ({baseCurrency})</span>
            <span className="w-1/3 text-right">Price (USD)</span>
          </div>

          {/* Asks Feed (Red) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end pt-1 pb-1">
            {renderAsks.map((ask) => (
              <OrderBookRow key={ask.price} level={ask} type="ask" symbol={focusedSymbol} />
            ))}
          </div>

          {/* Metrics Bar (Spread & Imbalance) */}
          <OrderBookMetrics metrics={metrics} symbol={focusedSymbol} />

          {/* Bids Table Headers */}
          <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] border-b border-gray-800 shrink-0">
            <span className="w-1/3 text-left">Price (USD)</span>
            <span className="w-1/3 text-center">Size ({baseCurrency})</span>
            <span className="w-1/3 text-right">Total ({baseCurrency})</span>
          </div>

          {/* Bids Feed (Green) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-1 pb-1">
            {bids.map((bid) => (
              <OrderBookRow key={bid.price} level={bid} type="bid" symbol={focusedSymbol} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
