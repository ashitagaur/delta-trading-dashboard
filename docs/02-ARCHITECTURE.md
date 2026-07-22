# Architecture: Delta Trading Dashboard

This document describes the **final implemented architecture** of the real-time trading dashboard. It reflects the actual codebase, not the original plan.

---

## 1. Component Boundaries & Render Isolation

To handle aggressive WebSocket data rates without degrading React rendering performance, every component is scoped to read the minimum possible slice of state.

- **No React Context for hot data.** Context re-renders every consumer on any update. All high-frequency data (tickers, order book, trades) lives exclusively in Zustand stores.
- **Granular Zustand selectors.** Each `TickerCard` uses a selector bound strictly to its own symbol: `useTickerStore(state => state.tickers['BTCUSD'])`. An ETHUSD update never causes a BTCUSD card to re-render.
- **`React.memo` on row components.** `OrderBookRow` and `TradesRow` are memoized with custom `areEqual` comparators that prevent re-renders unless the specific row's price, size, or cumulative depth has changed.
- **Focused product state.** The active symbol lives in `useMarketStore`. The `OrderBookPanel` and `TradesPanel` subscribe only to their respective stores and the focused symbol — they are completely isolated from ticker updates.

---

## 2. State Architecture (Zustand)

Four purpose-built Zustand stores with strict separation of concerns:

| Store | Owns |
|---|---|
| `useMarketStore` | `focusedSymbol`, `connectionStatus`, `setFocusedSymbol` |
| `useTickerStore` | `tickers: Record<SymbolId, TickerMessage>`, `updateTickers(batch)` |
| `useOrderBookStore` | Processed `bids`, `asks`, `metrics`, `groupTick`, `updateOrderBook`, `reset` |
| `useTradesStore` | `aggregatedTrades`, `rawTradesQueue`, `buyVolume1m`, `sellVolume1m`, `trades1m` |

All stores expose **batch mutation APIs** (`updateTickers(msgs[])`, `addTrades(msgs[])`) that process arrays in a single `set()` call to minimize Zustand subscriber notifications.

---

## 3. WebSocket Singleton & Connection Lifecycle

`WebSocketManager` is a pure TypeScript singleton that lives **outside the React component tree**.

```
App mounts
  → useWebSocketConnection (hook)
    → WebSocketManager.getInstance()
    → .setCallbacks(onStatus, onMessage)
    → .subscribe('v2/ticker', ALL_SYMBOLS)
    → .subscribe('l2_orderbook', [focusedSymbol])
    → .subscribe('all_trades', [focusedSymbol])
    → .connect()
```

**Reconnection:** On `onclose`, the manager immediately transitions to `reconnecting`, applies exponential backoff (`1s → 2s → 4s → ... → 30s max`), and retries up to 10 times. On successful reconnect, `resubscribeActiveChannels()` replays all active subscriptions automatically.

**Symbol switching (`setFocusedSymbol`):**
1. `unsubscribe('l2_orderbook', [prevSymbol])`
2. `unsubscribe('all_trades', [prevSymbol])`
3. `orderBookStore.reset()` + `tradesStore.reset()` — clear stale data immediately
4. `subscribe('l2_orderbook', [newSymbol])`
5. `subscribe('all_trades', [newSymbol])`

The Shimmer UI appears during the data-clear window and disappears as soon as the first payload from the new symbol arrives.

---

## 4. High-Frequency Message Handling (Buffered Flush Model)

The WebSocket `onmessage` callback **does not write to Zustand directly**. Instead, it writes into three lightweight mutable JavaScript variables:

```typescript
let latestOrderBookMsg: OrderBookMessage | null = null;  // Overwritten, not appended
let tradesBuffer: TradeMessage[] = [];                   // Appended
let tickersBuffer: TickerMessage[] = [];                 // Appended
```

A `setInterval` fires every **100ms** and flushes all buffered data to Zustand in a single batch:

```
100ms tick:
  → orderBookStore.updateOrderBook(latestOrderBookMsg)  (only most recent snapshot)
  → tradesStore.addTrades(tradesBuffer)                 (entire batch)
  → tickerStore.updateTickers(tickersBuffer)            (entire batch)
  → clear all buffers
```

This caps React reconciliation to 10 updates/second per panel, regardless of backend rate.

---

## 5. Data Processing Pipelines

### Order Book

The backend sends full 500-level snapshots every message (no delta encoding).

1. Raw `bids` / `asks` arrays are fed to `groupOrderBook(levels, tickSize, isAsk)` — a pure function that snaps each price to the configured tick bucket (`Math.floor` for bids, `Math.ceil` for asks).
2. Grouped levels pass through `processCumulativeDepths()` which calculates cumulative sizes and depth bar percentages.
3. `calculateMetrics()` derives spread, midpoint, and bid/ask imbalance ratio.
4. The final processed object is committed to `useOrderBookStore` in a single `set()`.

### Trades Feed

1. Incoming `TradeMessage[]` batch is iterated. Each trade checks the `agg[0]` (most recent aggregated trade): if price, direction, and ≤100ms timestamp all match, it merges (size += newSize, count++). Otherwise, a new row is prepended with `unshift`.
2. `aggregatedTrades` is bounded to **50 visible rows**.
3. A parallel `rawTradesQueue` (bounded to **5,000 entries**) tracks raw trades for rolling 1-minute volume statistics.
4. `useTradesDecay` runs a 5-second `setInterval` to prune trades older than 60s from the rolling queue.

---

## 6. Actual Folder Structure

```text
src/
├── __tests__/
│   ├── services/WebSocketManager.test.ts
│   ├── store/
│   │   ├── marketStore.test.ts
│   │   ├── orderBookStore.test.ts
│   │   ├── tickerStore.test.ts
│   │   └── tradesStore.test.ts
│   └── utils/
│       ├── format.test.ts
│       ├── orderbook.test.ts
│       ├── parse.test.ts
│       └── trades.test.ts
├── components/
│   ├── Layout/
│   │   ├── GlobalHeader.tsx
│   │   ├── Dashboard.tsx
│   │   └── Footer.tsx
│   ├── OrderBook/
│   │   ├── OrderBookPanel.tsx
│   │   ├── OrderBookRow.tsx       # React.memo with custom areEqual
│   │   └── OrderBookMetrics.tsx
│   ├── TradesFeed/
│   │   ├── TradesPanel.tsx
│   │   └── TradesRow.tsx          # React.memo
│   ├── Tickers/
│   │   ├── TickerBar.tsx
│   │   └── TickerCard.tsx
│   ├── OrderEntry/
│   │   └── OrderEntryPanel.tsx
│   └── Shared/
│       ├── ConnectionStatusIndicator.tsx
│       ├── TableShimmer.tsx
│       └── PanelPlaceholder.tsx
├── hooks/
│   ├── useWebSocketConnection.ts  # Buffer + flush interval lifecycle
│   ├── useFlashEffect.ts          # Price flash animation ref
│   └── useTradesDecay.ts          # 60s rolling window pruner
├── services/
│   └── WebSocketManager.ts        # Singleton, reconnect, subscription registry
├── store/
│   ├── marketStore.ts
│   ├── tickerStore.ts
│   ├── orderBookStore.ts
│   └── tradesStore.ts
├── types/
│   └── market.ts
├── utils/
│   ├── format.ts
│   ├── orderbook.ts
│   ├── parse.ts
│   └── trades.ts
└── constants/
    └── market.ts                  # SUPPORTED_SYMBOLS, SYMBOL_CONFIG, grouping options
```

---

## 7. Connection Status UI Contract

| Status | Indicator | Panel Behavior |
|---|---|---|
| `connecting` | Yellow dot | Shimmer skeleton shown |
| `connected` | Green dot | Live data rendered |
| `reconnecting` | Orange dot | **Existing data preserved** (not wiped); shimmer NOT shown |
| `disconnected` | Red dot | "Disconnected" placeholder shown |

The key decision: `isReady` in both panels is driven purely by **data presence**, not connection status. This means a brief reconnect does not flash a loading state — the user sees a frozen-but-visible order book with an orange status indicator instead.
