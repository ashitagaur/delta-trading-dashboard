import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketManager } from './WebSocketManager';

describe('WebSocketManager', () => {
  let wsMock: {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    readyState: number;
    onopen?: () => void;
    onclose?: () => void;
    onmessage?: (e: { data: string }) => void;
  };
  let manager: WebSocketManager;

  beforeEach(() => {
    vi.useFakeTimers();
    wsMock = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1, // OPEN
    };
    
    const MockWebSocket = vi.fn(() => wsMock) as unknown as typeof WebSocket;
    Object.assign(MockWebSocket, {
      OPEN: 1,
      CONNECTING: 0,
      CLOSING: 2,
      CLOSED: 3,
    });
    vi.stubGlobal('WebSocket', MockWebSocket);
    
    manager = WebSocketManager.getInstance();
    manager._resetForTest();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects and updates status', () => {
    const statusFn = vi.fn();
    manager.setCallbacks(statusFn, vi.fn());
    
    manager.connect();
    expect(statusFn).toHaveBeenCalledWith('connecting');
    
    // Simulate open
    wsMock.onopen?.();
    expect(statusFn).toHaveBeenCalledWith('connected');
  });

  it('handles automatic reconnection with exponential backoff', () => {
    const statusFn = vi.fn();
    manager.setCallbacks(statusFn, vi.fn());
    
    manager.connect();
    wsMock.onopen?.(); // connected
    
    // Simulate drop
    wsMock.onclose?.();
    expect(statusFn).toHaveBeenCalledWith('reconnecting');
    
    // First backoff is 1000ms
    vi.advanceTimersByTime(1000);
    // After 1000ms, it should try to connect again (creates new WS instance)
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });

  it('deduplicates subscriptions', () => {
    manager.connect();
    wsMock.onopen?.();
    
    manager.subscribe('v2/ticker', ['BTCUSD']);
    expect(wsMock.send).toHaveBeenCalledTimes(1);
    const payload1 = JSON.parse(wsMock.send.mock.calls[0][0]);
    expect(payload1.payload.channels[0].symbols).toEqual(['BTCUSD']);
    
    wsMock.send.mockClear();
    
    // Subscribing again to BTCUSD should NOT send a payload
    manager.subscribe('v2/ticker', ['BTCUSD']);
    expect(wsMock.send).not.toHaveBeenCalled();
    
    // Subscribing to new symbol should send payload with only new symbol
    manager.subscribe('v2/ticker', ['ETHUSD']);
    expect(wsMock.send).toHaveBeenCalledTimes(1);
    const payload2 = JSON.parse(wsMock.send.mock.calls[0][0]);
    expect(payload2.payload.channels[0].symbols).toEqual(['ETHUSD']);
  });

  it('routes valid incoming messages', () => {
    const msgFn = vi.fn();
    manager.setCallbacks(vi.fn(), msgFn);
    
    manager.connect();
    wsMock.onopen?.();
    
    const validMessage = { type: 'v2/ticker', symbol: 'BTCUSD' };
    wsMock.onmessage?.({ data: JSON.stringify(validMessage) });
    
    expect(msgFn).toHaveBeenCalledWith(validMessage);
  });
});
