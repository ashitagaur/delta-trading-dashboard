export type SymbolId = 'BTCUSD' | 'ETHUSD' | 'XRPUSD' | 'SOLUSD' | 'PAXGUSD' | 'DOGEUSD';

export type ChannelName = 'v2/ticker' | 'l2_orderbook' | 'all_trades';

export interface BaseMessage {
  type: string;
}

export interface TickerMessage extends BaseMessage {
  type: 'v2/ticker';
  symbol: SymbolId;
  close: number;
  open: number;
  high: number;
  low: number;
  mark_price: string;
  spot_price: string;
  volume: number;
  turnover: number;
  funding_rate: string;
  ltp_change_24h: string; // Multiplier! e.g., "1.0123"
  mark_change_24h: string;
  timestamp: number; // microseconds
  quotes: {
    best_ask: string;
    best_bid: string;
    ask_size: string;
    bid_size: string;
  };
}

export type OrderBookLevel = [string, string]; // [price, size]

export interface OrderBookMessage extends BaseMessage {
  type: 'l2_orderbook';
  symbol: SymbolId;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number; // microseconds
}

export interface TradeMessage extends BaseMessage {
  type: 'all_trades';
  symbol: SymbolId;
  price: string;
  size: number;
  buyer_role: 'maker' | 'taker';
  seller_role: 'maker' | 'taker';
  timestamp: number; // microseconds
  product_id: number;
}

export interface SubscriptionAckMessage extends BaseMessage {
  type: 'subscriptions';
  payload: {
    channels: Array<{ name: string; symbols: SymbolId[] }>;
  };
}

export type WebSocketMessage =
  | TickerMessage
  | OrderBookMessage
  | TradeMessage
  | SubscriptionAckMessage;
