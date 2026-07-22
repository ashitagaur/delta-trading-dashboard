import { SymbolId, ChannelName } from '../types/market';

export const SUPPORTED_SYMBOLS: SymbolId[] = [
  'BTCUSD', 'ETHUSD', 'XRPUSD', 'SOLUSD', 'PAXGUSD', 'DOGEUSD'
];

export const STATIC_CHANNELS: ChannelName[] = [
  'v2/ticker', 'l2_orderbook', 'all_trades'
];

export interface SymbolConfig {
  precision: number;
  groupingOptions: number[];
  defaultGrouping: number;
}

export const SYMBOL_CONFIG: Record<SymbolId, SymbolConfig> = {
  BTCUSD: { precision: 1, groupingOptions: [1, 5, 10, 50, 100, 500], defaultGrouping: 1 },
  ETHUSD: { precision: 2, groupingOptions: [0.5, 1, 5, 10, 50], defaultGrouping: 0.5 },
  XRPUSD: { precision: 4, groupingOptions: [0.0001, 0.001, 0.01, 0.1], defaultGrouping: 0.0001 },
  SOLUSD: { precision: 4, groupingOptions: [0.0001, 0.001, 0.01, 0.1], defaultGrouping: 0.0001 },
  PAXGUSD: { precision: 2, groupingOptions: [0.5, 1, 5, 10, 50], defaultGrouping: 0.5 },
  DOGEUSD: { precision: 6, groupingOptions: [0.000001, 0.00001, 0.0001, 0.001], defaultGrouping: 0.000001 },
};
