import { PanelPlaceholder } from '../Shared/PanelPlaceholder';

export function OrderBookPanel() {
  return (
    <section className="w-[320px] lg:w-[350px] border-r border-gray-800 bg-bg-base shrink-0 flex flex-col p-4">
      <div className="text-text-muted font-semibold mb-4 text-sm">ORDER BOOK</div>
      <PanelPlaceholder text="Order Book Placeholder" />
    </section>
  );
}
