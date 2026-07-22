import { GlobalHeader } from './GlobalHeader';
import { TickerBar } from '../TickerBar/TickerBar';
import { OrderBookPanel } from '../OrderBook/OrderBookPanel';
import { TradesPanel } from '../TradesFeed/TradesPanel';

export function Dashboard() {
  return (
    <div className="h-screen w-full bg-bg-base text-text-main flex flex-col font-sans text-xs">
      <GlobalHeader />
      <TickerBar />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden overflow-y-auto lg:overflow-y-hidden">
        <OrderBookPanel />
        <TradesPanel />
      </main>
    </div>
  );
}
