import { GlobalHeader } from './GlobalHeader';
import { TickerBar } from '../TickerBar/TickerBar';
import { OrderBookPanel } from '../OrderBook/OrderBookPanel';
import { TradesPanel } from '../TradesFeed/TradesPanel';

export function Dashboard() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base text-gray-200 font-sans">
      <GlobalHeader />
      <TickerBar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Order Book (Left side on desktop) */}
        <OrderBookPanel />

        {/* Center Panel Placeholder (Chart/Order Entry) */}
        <div className="flex-1 p-4 border-b lg:border-b-0 border-gray-800 flex items-center justify-center text-gray-500">
          Chart & Order Entry Placeholder
        </div>

        {/* Recent Trades (Right side on desktop) */}
        <TradesPanel />
        
      </main>
    </div>
  );
}
