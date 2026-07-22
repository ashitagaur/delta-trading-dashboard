# Architecture: Delta Trading Dashboard

This document outlines the technical architecture for the real-time trading dashboard. The primary challenge is maintaining strict render isolation and stable performance under extreme WebSocket data loads (stress conditions).

---

## 1. Component Boundaries & Render Isolation

To achieve 100% render isolation, we must ensure that high-frequency updates to one domain (e.g., a specific ticker) do not trigger React renders in unrelated domains (e.g., other tickers, the order book, or the trades feed).

- **Global Context Avoidance:** We will avoid React Context for high-frequency data, as updating a Context provider re-renders all consumers.
- **Granular Selectors:** We will use Zustand for state management. Components will select only the exact slices of state they need.
- **Ticker Isolation:** The `TickerBar` will not render the actual prices. It will only render a list of `TickerCard` components. Each `TickerCard` uses a selector strictly tied to its own symbol: `useTickerStore(state => state.tickers['BTCUSD'])`. This ensures a BTCUSD update never renders ETHUSD.
- **Focused Product State:** The currently selected symbol will live in a separate `useUIStore`. The Order Book and Trades panels will only re-render when their specific data store updates or the focused symbol changes.

## 2. State Ownership (Zustand)

We will use **Zustand** due to its lightweight nature, selector-based rendering, and ability to be updated from outside the React lifecycle (crucial for WebSocket integration).

We will split the state into separate stores to guarantee isolation:
- `useUIStore`: Holds the focused symbol, order book grouping level, and large trade threshold.
- `useTickerStore`: Holds the latest ticker data for all 6 symbols.
- `useOrderbookStore`: Holds the processed order book data for the focused symbol.
- `useTradesStore`: Holds the aggregated trades list and 60s rolling statistics.
- `useConnectionStore`: Holds the WebSocket status (connected, reconnecting, etc.).

## 3. WebSocket Singleton & Lifecycle

The WebSocket connection will be managed by a pure TypeScript singleton (`WebSocketManager`) living outside the React component tree.

- **Initialization:** Instantiated once on application load.
- **Subscription Management:** Maintains an internal registry of desired channels and symbols. It exposes a `subscribe(channel, symbols)` and `unsubscribe(channel, symbols)` API for components to declare their data needs.
- **Multiplexing:** It manages sending the correct JSON payloads to the backend when subscriptions change, handling the transition smoothly.
- **Routing:** On receiving a message, it parses the JSON and directly invokes the setter functions of the appropriate Zustand stores (`useTickerStore.getState().setTicker(data)`).
- **Reconnection:** If the connection drops, it immediately updates `useConnectionStore`, applies exponential backoff, and attempts to reconnect. Upon successful reconnection, it automatically re-transmits all currently registered subscriptions.

## 4. High-Frequency Message Handling

The backend stress test can push updates at 1-5ms intervals. React cannot (and should not) render at 200+ FPS.

- **Throttling Updates:** The `WebSocketManager` will not push every single message to Zustand immediately. Instead, it will write incoming data to a mutable buffer.
- **Render Batching:** A `requestAnimationFrame` (rAF) loop (running at ~60Hz / 16ms) will flush the buffer to the Zustand stores. This caps React updates to a maximum of 60 renders per second per component, regardless of how fast the backend pushes data.

## 5. Data Processing Pipelines

### Order Book (Grouping & Derived Metrics)
The backend sends full 500-level snapshots (1000 items). 
- **Processing:** Grouping calculations, depth bar calculations, and spread/imbalance metrics will be computed in a pure function *before* being committed to the Zustand store.
- **Thread:** Given the 16ms throttle, modern JS engines can easily process an array of 1000 items in a few milliseconds on the main thread. We will avoid the complexity of Web Workers unless profiling explicitly proves it necessary.
- **Flashing:** The grouping function will compare the new grouped sizes against the previous store state to flag levels that changed by >10% for red/green flashing.

### Trades (Aggregation & Rolling Stats)
- **100ms Aggregation:** As trades arrive, the buffer checks the last trade. If `newTrade.price === lastTrade.price` and `newTrade.time - lastTrade.time <= 100ms`, they are merged (size added, count incremented). Otherwise, it's pushed as a new entry.
- **60s Rolling Window:** The `useTradesStore` will maintain a separate array of trades from the last 60 seconds. A periodic interval (every 1 second) will prune trades older than 60s and recalculate the rolling volume and average size.
- **Virtualization:** The Trades feed will use `@tanstack/react-virtual` to ensure only the visible rows are rendered in the DOM, maintaining 60FPS even with thousands of aggregated trades in history.

## 6. Proposed Folder Structure

```text
src/
├── components/
│   ├── Tickers/          # TickerBar, TickerCard
│   ├── OrderBook/        # OrderBookPanel, LevelRow, SpreadMetrics
│   ├── Trades/           # TradesFeed, TradeRow, RollingStats
│   └── Shared/           # Dropdowns, StatusIndicators
├── store/
│   ├── uiStore.ts
│   ├── tickerStore.ts
│   ├── orderbookStore.ts
│   ├── tradesStore.ts
│   └── connectionStore.ts
├── services/
│   ├── WebSocketManager.ts
│   └── ws-types.ts       # TypeScript interfaces for payloads
├── utils/
│   ├── formatters.ts     # Currency and precision formatting
│   ├── orderbook.ts      # Pure grouping/aggregation functions
│   └── trades.ts         # Pure trade merging logic
├── hooks/
│   └── useAutoScroll.ts  # Logic for trades auto-scroll and pausing
├── App.tsx
└── main.tsx
```

## 7. Testing Strategy

1. **Unit Testing Pure Logic (Critical):** The math inside `utils/orderbook.ts` (grouping decimals without floating-point errors) and `utils/trades.ts` (100ms aggregation) will be heavily tested using Vitest.
2. **WebSocket Manager:** Test connection lifecycle, automatic resubscription, and exponential backoff using `vitest-websocket-mock`.
3. **Component Rendering:** Use React Testing Library to verify that user interactions (like switching symbols or changing grouping) correctly trigger state updates.
4. **Stress Testing:** Manually use the backend's runtime config API to push trades to 1ms intervals and verify via React Profiler that render isolation holds and no memory leaks occur.
