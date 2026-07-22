import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { WebSocketManager } from '../services/WebSocketManager';
import { STATIC_CHANNELS } from '../constants/market';

export function useWebSocketConnection() {
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);

  useEffect(() => {
    const wsManager = WebSocketManager.getInstance();

    wsManager.setCallbacks(
      (status) => {
        setConnectionStatus(status);
      },
      () => {
        // Message routing will be added in upcoming phases
        // console.log(msg);
      }
    );

    // Track the initial symbol before connecting
    const initialSymbol = useMarketStore.getState().focusedSymbol;
    STATIC_CHANNELS.forEach(channel => {
      wsManager.subscribe(channel, [initialSymbol]);
    });

    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, [setConnectionStatus]);
}
