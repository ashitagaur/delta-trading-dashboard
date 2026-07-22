import { useMarketStore } from '../../store/marketStore';

export function ConnectionStatusIndicator() {
  const status = useMarketStore((state) => state.connectionStatus);
  
  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    reconnecting: 'bg-orange-500',
    disconnected: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-xs uppercase hidden sm:block">{status}</span>
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
    </div>
  );
}
