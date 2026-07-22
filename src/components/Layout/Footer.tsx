export function Footer() {
  return (
    <footer className="flex flex-col lg:flex-row border-t border-gray-800 bg-[#161a25] text-[#848e9c] text-[10px] shrink-0 font-sans tracking-wide">
      {/* Order Book Legend */}
      <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-800 p-2.5 flex flex-wrap items-center justify-start gap-x-8 gap-y-2 px-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]"></span>
          <span>Flash red on size decrease ≥10%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]"></span>
          <span>Flash green on size increase ≥10%</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span>Depth bars scale to max cumulative volume in view</span>
        </div>
      </div>
      
      {/* Trades Legend */}
      <div className="flex-1 p-2.5 flex flex-wrap items-center justify-start gap-x-8 gap-y-2 px-6">
        <div className="flex items-center gap-2">
          <span>📦</span>
          <span>"(3)" = aggregated trades at same price within 100ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔥</span>
          <span>Bold + left border = large trade above threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span>Rolling stats update every 1s</span>
        </div>
      </div>
    </footer>
  );
}
