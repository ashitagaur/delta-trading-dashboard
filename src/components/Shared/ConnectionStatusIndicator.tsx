import { useMarketStore } from '../../store/marketStore';

export function ConnectionStatusIndicator() {
  const status = useMarketStore((state) => state.connectionStatus);
  
  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    reconnecting: 'bg-orange-500',
    disconnected: 'bg-red-500',
  };
  
  const textColors = {
    connected: 'text-green-500',
    connecting: 'text-yellow-500',
    reconnecting: 'text-orange-500',
    disconnected: 'text-red-500',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
      <span className={`capitalize font-semibold ${textColors[status]}`}>{status}</span>
    </div>
  );
}
