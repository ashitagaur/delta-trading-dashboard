import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMarketStore } from './marketStore';
import { WebSocketManager } from '../services/WebSocketManager';

const { wsMockInstance } = vi.hoisted(() => ({
  wsMockInstance: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }
}));

// Mock WebSocketManager
vi.mock('../services/WebSocketManager', () => {
  return {
    WebSocketManager: {
      getInstance: vi.fn(() => wsMockInstance)
    }
  };
});

describe('marketStore', () => {
  let storeMock: Record<string, string> = {};

  beforeEach(() => {
    storeMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storeMock[key] || null),
      setItem: vi.fn((key: string, value: string) => { storeMock[key] = value; }),
      clear: vi.fn(() => { storeMock = {}; }),
    });
    useMarketStore.setState({ focusedSymbol: 'BTCUSD', connectionStatus: 'disconnected' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('setFocusedSymbol updates state and localStorage', () => {
    useMarketStore.getState().setFocusedSymbol('SOLUSD');
    expect(useMarketStore.getState().focusedSymbol).toBe('SOLUSD');
    expect(localStorage.getItem('delta_focused_symbol')).toBe('SOLUSD');
  });

  it('setFocusedSymbol manages websocket subscriptions', () => {
    const wsMock = WebSocketManager.getInstance();
    
    useMarketStore.getState().setFocusedSymbol('ETHUSD');
    
    // Should unsubscribe from BTCUSD (previous) on specific channels
    expect(wsMock.unsubscribe).toHaveBeenCalledWith('l2_orderbook', ['BTCUSD']);
    expect(wsMock.unsubscribe).toHaveBeenCalledWith('all_trades', ['BTCUSD']);
    
    // Should subscribe to ETHUSD (new)
    expect(wsMock.subscribe).toHaveBeenCalledWith('l2_orderbook', ['ETHUSD']);
    expect(wsMock.subscribe).toHaveBeenCalledWith('all_trades', ['ETHUSD']);

    // Should NOT unsubscribe/subscribe to v2/ticker (handled on mount for all symbols)
    expect(wsMock.unsubscribe).not.toHaveBeenCalledWith('v2/ticker', expect.anything());
    expect(wsMock.subscribe).not.toHaveBeenCalledWith('v2/ticker', expect.anything());
  });
});
