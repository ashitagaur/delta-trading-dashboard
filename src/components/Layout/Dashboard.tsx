import { GlobalHeader } from './GlobalHeader';
import { TickerBar } from '../TickerBar/TickerBar';
import { OrderBookPanel } from '../OrderBook/OrderBookPanel';
import { TradesPanel } from '../TradesFeed/TradesPanel';
import { Footer } from './Footer';

export function Dashboard() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0b0e11] text-gray-200 font-sans">
      <GlobalHeader />
      <TickerBar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-row">
        <OrderBookPanel />
        <TradesPanel />
      </main>

      <Footer />
    </div>
  );
}
