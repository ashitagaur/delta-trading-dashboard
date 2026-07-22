import { PanelPlaceholder } from '../Shared/PanelPlaceholder';

export function TradesPanel() {
  return (
    <section className="flex-1 bg-bg-base flex flex-col p-4 min-w-[300px]">
      <div className="text-text-muted font-semibold mb-4 text-sm">TRADES FEED</div>
      <PanelPlaceholder text="Trades Placeholder" />
    </section>
  );
}
