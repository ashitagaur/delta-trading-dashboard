import { WebSocketMessage, SymbolId, ChannelName } from '../types/market';
import { parseWebSocketMessage } from '../utils/parse';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private url = 'ws://localhost:8080';
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelayMs = 1000;
  
  // Track active subscriptions to deduplicate and resubscribe on reconnect
  private activeSubscriptions = new Map<ChannelName, Set<SymbolId>>();
  
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onMessageReceived?: (msg: WebSocketMessage) => void;

  private reconnectTimeoutId?: ReturnType<typeof setTimeout>;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public setCallbacks(
    onStatusChange: (status: ConnectionStatus) => void,
    onMessageReceived: (msg: WebSocketMessage) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onMessageReceived = onMessageReceived;
    // Broadcast current status immediately
    this.onStatusChange(this.status);
  }

  public connect(url?: string) {
    if (url) this.url = url;
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.updateStatus('connecting');
    this.setupWebSocket();
  }

  private setupWebSocket() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
        this.resubscribeActiveChannels();
      };

      this.ws.onmessage = (event) => {
        const parsed = parseWebSocketMessage(event.data);
        if (parsed && this.onMessageReceived) {
          this.onMessageReceived(parsed);
        }
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onerror = () => {
        // Error will also trigger onclose, handle reconnect logic there
      };
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.status === 'disconnected') return; // Deliberate disconnect
    
    this.updateStatus('reconnecting');
    this.ws = null;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts), 30000); // Max 30s backoff
      this.reconnectAttempts++;
      
      if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = setTimeout(() => {
        this.setupWebSocket();
      }, delay);
    } else {
      this.updateStatus('disconnected');
    }
  }

  public disconnect() {
    this.updateStatus('disconnected');
    if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private updateStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    if (this.onStatusChange) {
      this.onStatusChange(this.status);
    }
  }

  // --- Subscription Management ---

  public subscribe(channel: ChannelName, symbols: SymbolId[]) {
    let currentSet = this.activeSubscriptions.get(channel);
    if (!currentSet) {
      currentSet = new Set<SymbolId>();
      this.activeSubscriptions.set(channel, currentSet);
    }

    // Only track new symbols we aren't already subscribed to
    const newSymbols: SymbolId[] = [];
    for (const sym of symbols) {
      if (!currentSet.has(sym)) {
        currentSet.add(sym);
        newSymbols.push(sym);
      }
    }

    if (newSymbols.length > 0 && this.status === 'connected') {
      this.sendSubscribePayload(channel, newSymbols);
    }
  }

  public unsubscribe(channel: ChannelName, symbols?: SymbolId[]) {
    const currentSet = this.activeSubscriptions.get(channel);
    if (!currentSet) return;

    if (!symbols) {
      // Unsubscribe all
      this.activeSubscriptions.delete(channel);
      if (this.status === 'connected') {
        this.sendUnsubscribePayload(channel);
      }
    } else {
      const symbolsToRemove: SymbolId[] = [];
      for (const sym of symbols) {
        if (currentSet.has(sym)) {
          currentSet.delete(sym);
          symbolsToRemove.push(sym);
        }
      }

      if (currentSet.size === 0) {
        this.activeSubscriptions.delete(channel);
      }

      if (symbolsToRemove.length > 0 && this.status === 'connected') {
        this.sendUnsubscribePayload(channel, symbolsToRemove);
      }
    }
  }

  private resubscribeActiveChannels() {
    for (const [channel, symbols] of this.activeSubscriptions.entries()) {
      if (symbols.size > 0) {
        this.sendSubscribePayload(channel, Array.from(symbols));
      }
    }
  }

  private sendSubscribePayload(name: ChannelName, symbols: SymbolId[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: "subscribe",
      payload: {
        channels: [{ name, symbols }]
      }
    }));
  }

  private sendUnsubscribePayload(name: ChannelName, symbols?: SymbolId[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const channelObj: { name: string; symbols?: SymbolId[] } = { name };
    if (symbols && symbols.length > 0) {
      channelObj.symbols = symbols;
    }

    this.ws.send(JSON.stringify({
      type: "unsubscribe",
      payload: {
        channels: [channelObj]
      }
    }));
  }

  // Used only for testing
  public _resetForTest() {
    this.disconnect();
    this.activeSubscriptions.clear();
    this.onStatusChange = undefined;
    this.onMessageReceived = undefined;
    this.reconnectAttempts = 0;
  }
}
