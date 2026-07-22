import { TickerBar } from '../TickerBar/TickerBar';
import { OrderBookPanel } from '../OrderBook/OrderBookPanel';
import { TradesPanel } from '../TradesFeed/TradesPanel';

export function Dashboard() {
  return (
    <div className="h-full bg-bg-base text-text-main flex flex-col font-sans text-xs">
      <TickerBar />
      <main className="flex-1 flex overflow-hidden">
        <OrderBookPanel />
        <TradesPanel />
      </main>
    </div>
  );
}
