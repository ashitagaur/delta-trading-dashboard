import { PanelPlaceholder } from '../Shared/PanelPlaceholder';
import { useMarketStore } from '../../store/marketStore';

export function TradesPanel() {
  const status = useMarketStore((state) => state.connectionStatus);

  return (
    <section className="flex-1 bg-bg-base flex flex-col p-4 min-w-[300px] min-h-[300px]">
      <div className="text-text-muted font-semibold mb-4 text-sm">TRADES FEED</div>
      {status === 'connecting' || status === 'reconnecting' ? (
        <PanelPlaceholder text="Loading Trades..." />
      ) : status === 'disconnected' ? (
        <PanelPlaceholder text="Disconnected" />
      ) : (
        <PanelPlaceholder text="Trades Data (Ready)" />
      )}
    </section>
  );
}
