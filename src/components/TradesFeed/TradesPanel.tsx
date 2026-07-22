import { useRef, useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useTradesStore } from '../../store/tradesStore';
import { useTradesDecay } from '../../hooks/useTradesDecay';
import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { TradesRow } from './TradesRow';
import { formatSize } from '../../utils/format';

export function TradesPanel() {
  const status = useMarketStore((state) => state.connectionStatus);
  const focusedSymbol = useMarketStore((state) => state.focusedSymbol);
  const baseCurrency = focusedSymbol.replace('USD', '');
  
  const { aggregatedTrades, buyVolume1m, sellVolume1m, trades1m } = useTradesStore();

  useTradesDecay();

  const isReady = status === 'connected' && aggregatedTrades.length > 0;
  const totalVolume = buyVolume1m + sellVolume1m;
  const avgSize = trades1m > 0 ? (totalVolume / trades1m) : 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      setIsScrolled(scrollRef.current.scrollTop > 50);
    }
  };

  const jumpToLatest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  return (
    <section className="flex-1 w-full bg-[#0b0e11] flex flex-col h-full min-w-0 border-t lg:border-t-0 border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 shrink-0">
        <span className="text-gray-200 font-bold">Recent Trades — {focusedSymbol}</span>
        <span className="text-gray-500 text-xs flex items-center gap-2">
          Large trade ≥ <span className="text-gray-300 font-mono bg-gray-800 px-1 rounded">$10,000</span>
        </span>
      </div>

      {!isReady ? (
        <div className="p-4 flex-1">
          <PanelPlaceholder text={status === 'disconnected' ? 'Disconnected' : 'Waiting for trades...'} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Stats Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900/30 border-b border-gray-800 shrink-0">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px]">1m Volume</span>
              <div className="flex items-baseline gap-2">
                <span className="text-green-500 font-mono text-xs font-bold">{formatSize(buyVolume1m)} <span className="text-[10px] font-sans font-normal">buy</span></span>
                <span className="text-red-500 font-mono text-xs font-bold">{formatSize(sellVolume1m)} <span className="text-[10px] font-sans font-normal">sell</span></span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-[10px]">1m Trades</span>
              <span className="text-gray-200 font-mono text-xs font-bold">{trades1m.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[10px]">Avg Size</span>
              <span className="text-gray-200 font-mono text-xs font-bold">{formatSize(avgSize)} {baseCurrency}</span>
            </div>
          </div>

          {/* Table Headers */}
          <div className="flex justify-between px-2 py-1 text-gray-500 text-[10px] border-b border-gray-800 shrink-0">
            <span className="w-1/3 text-left">Time</span>
            <span className="w-1/3 text-center">Price (USD)</span>
            <span className="w-1/3 text-right">Size ({baseCurrency})</span>
          </div>

          {/* Trades Feed */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-1 pb-1 relative"
          >
            {aggregatedTrades.map((trade) => (
              <TradesRow key={trade.id} trade={trade} symbol={focusedSymbol} />
            ))}
          </div>

          {/* Jump to latest button */}
          {isScrolled && (
            <button 
              onClick={jumpToLatest}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e2330] hover:bg-[#2b313f] border border-gray-700 text-blue-400 px-4 py-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] text-xs font-bold transition-colors flex items-center gap-2 z-10"
            >
              ↓ Jump to latest
            </button>
          )}
        </div>
      )}
    </section>
  );
}
