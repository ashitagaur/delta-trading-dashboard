import { SUPPORTED_SYMBOLS } from '../../constants/market';
import { TickerCard } from './TickerCard';

export function TickerBar() {
  return (
    <section className="flex items-stretch overflow-x-auto border-b border-gray-800 bg-bg-panel shrink-0 select-none custom-scrollbar">
      {SUPPORTED_SYMBOLS.map((sym) => (
        <TickerCard key={sym} symbol={sym} />
      ))}
    </section>
  );
}
