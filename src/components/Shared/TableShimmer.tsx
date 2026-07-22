export function TableShimmer({ rowCount = 20 }: { rowCount?: number }) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col pt-2 px-2">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div 
          key={i} 
          className="flex justify-between items-center py-[4px] opacity-20 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-2 bg-gray-600 rounded w-1/4"></div>
          <div className="h-2 bg-gray-600 rounded w-1/4 mx-2"></div>
          <div className="h-2 bg-gray-600 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}
