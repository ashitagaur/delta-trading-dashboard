import { useOrderBookStore } from '../../store/orderBookStore';
import { useMarketStore } from '../../store/marketStore';
import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { OrderBookRow } from './OrderBookRow';
import { OrderBookMetrics } from './OrderBookMetrics';

const GROUP_OPTIONS = [1, 5, 10, 50, 100, 500];

export function OrderBookPanel() {
  const status = useMarketStore((state) => state.connectionStatus);
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  
  const { bids, asks, metrics, groupTick, setGroupTick } = useOrderBookStore();

  const isReady = status === 'connected' && bids.length > 0;

  // Asks are sorted ascending (lowest price first) in the store.
  // We want to render them descending so the lowest ask is at the bottom (near the spread).
  const renderAsks = [...asks].reverse();

  return (
    <section className="flex-1 w-full border-b lg:border-b-0 lg:border-r border-gray-800 bg-[#0b0e11] flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-200 font-bold">Order Book</span>
          <span className="text-gray-400">—</span>
          <span className="text-gray-200 font-bold">{focusedSymbol}</span>
          <span className="bg-yellow-500/20 text-yellow-500 text-[9px] px-1.5 py-0.5 rounded font-bold ml-1 tracking-wider">LIVE</span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-gray-500 mr-1">Group:</span>
          {GROUP_OPTIONS.map(val => (
            <button
              key={val}
              onClick={() => setGroupTick(val)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                groupTick === val 
                  ? 'bg-blue-500/20 text-blue-400 font-bold' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {!isReady ? (
        <div className="p-4 flex-1">
          <PanelPlaceholder text={status === 'disconnected' ? 'Disconnected' : 'Loading Order Book...'} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table Headers */}
          <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] shrink-0 border-b border-gray-800">
            <span className="w-1/3 text-left">Total (BTC)</span>
            <span className="w-1/3 text-center">Size (BTC)</span>
            <span className="w-1/3 text-right">Price (USD)</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Asks (Red) */}
            <div className="flex flex-col justify-end min-h-[50%] pt-1">
              {renderAsks.map((ask) => (
                <OrderBookRow key={ask.price} level={ask} type="ask" symbol={focusedSymbol} />
              ))}
            </div>

            {/* Metrics */}
            <OrderBookMetrics metrics={metrics} symbol={focusedSymbol} />

            {/* Table Headers for Bids */}
            <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] shrink-0">
              <span className="w-1/3 text-left">Price (USD)</span>
              <span className="w-1/3 text-center">Size (BTC)</span>
              <span className="w-1/3 text-right">Total (BTC)</span>
            </div>

            {/* Bids (Green) */}
            <div className="flex flex-col justify-start min-h-[50%] pb-1">
              {bids.map((bid) => (
                <OrderBookRow key={bid.price} level={bid} type="bid" symbol={focusedSymbol} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
