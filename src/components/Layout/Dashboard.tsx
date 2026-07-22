import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="h-full bg-bg-base text-text-main flex flex-col font-sans text-xs">
      {/* Ticker Bar Area */}
      <header className="h-[60px] border-b border-gray-800 bg-bg-panel shrink-0 flex items-center px-4">
        <h1 className="text-text-muted font-semibold tracking-wider text-sm">TICKER BAR</h1>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Order Book Area */}
        <section className="w-[320px] lg:w-[350px] border-r border-gray-800 bg-bg-base shrink-0 flex flex-col p-4">
          <div className="text-text-muted font-semibold mb-4 text-sm">ORDER BOOK</div>
          <div className="flex-1 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 rounded-sm">
            Order Book Placeholder
          </div>
        </section>
        
        {/* Trades Feed Area */}
        <section className="flex-1 bg-bg-base flex flex-col p-4 min-w-[300px]">
          <div className="text-text-muted font-semibold mb-4 text-sm">TRADES FEED</div>
          <div className="flex-1 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 rounded-sm">
            Trades Placeholder
          </div>
        </section>
      </main>
    </div>
  );
};
