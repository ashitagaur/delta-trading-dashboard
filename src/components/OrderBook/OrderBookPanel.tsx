import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { useMarketStore } from '../../store/marketStore';

export function OrderBookPanel() {
  const status = useMarketStore((state) => state.connectionStatus);
  
  return (
    <section className="w-full lg:w-[320px] xl:w-[350px] border-b lg:border-b-0 lg:border-r border-gray-800 bg-bg-base shrink-0 flex flex-col p-4 min-h-[300px]">
      <div className="text-text-muted font-semibold mb-4 text-sm">ORDER BOOK</div>
      {status === 'connecting' || status === 'reconnecting' ? (
        <PanelPlaceholder text="Loading Order Book..." />
      ) : status === 'disconnected' ? (
        <PanelPlaceholder text="Disconnected" />
      ) : (
        <PanelPlaceholder text="Order Book Data (Ready)" />
      )}
    </section>
  );
}
