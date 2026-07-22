# Delta Trading Dashboard — Initial Analysis

## Assignment Summary

Build a **real-time crypto trading dashboard** (React + TypeScript) with three interconnected sections, all fed by a **single WebSocket connection** to a stress-test backend that pushes data at intentionally aggressive rates.

| Section | Channel | Default Interval | Core Challenge |
|---|---|---|---|
| **Ticker Bar** (always visible) | `v2/ticker` × 6 symbols | 10–50ms each | 12–30 updates/sec; isolate per-symbol renders |
| **Order Book** (focused product) | `l2_orderbook` × 1 symbol | 10–40ms | Grouping/aggregation pipeline at 10–50 Hz |
| **Trades Feed** (focused product) | `all_trades` × 1 symbol | 5–20ms | 50–200+ trades/sec; batching, virtualization |

**Total concurrent subscriptions:** 8 (6 tickers + 1 orderbook + 1 trades)

---

## Backend Protocol Analysis

### Connection & Subscription

- **WebSocket endpoint:** `ws://localhost:8080`
- **HTTP config API:** `http://localhost:3000/intervals` (GET/POST)
- No authentication, no heartbeat, no binary framing — plain JSON over WS

**Subscribe message:**
```json
{
  "type": "subscribe",
  "payload": {
    "channels": [
      { "name": "v2/ticker", "symbols": ["BTCUSD", "ETHUSD", ...] },
      { "name": "l2_orderbook", "symbols": ["BTCUSD"] },
      { "name": "all_trades", "symbols": ["BTCUSD"] }
    ]
  }
}
```

**Unsubscribe:** Same shape with `"type": "unsubscribe"`. Omitting `symbols` unsubscribes entire channel.

**Ack response:** After every sub/unsub, server sends back:
```json
{
  "type": "subscriptions",
  "payload": { "channels": [...current state...] }
}
```

### Critical Backend Behavior: Full Snapshots, NOT Deltas

> [!IMPORTANT]
> Despite the name "l2_orderbook", the backend sends **full 500-level snapshots** every tick — not incremental deltas. Every message contains the complete bid/ask arrays. This simplifies our state management (no need to maintain/merge a local book), but means **we're parsing and processing 1000 price levels every 10–40ms**.

---

## Payload Shapes (from [generators/](file:///Users/rishabhgaur/Desktop/assignment/socket-custom-load/generators))

### `v2/ticker` — [ticker.js](file:///Users/rishabhgaur/Desktop/assignment/socket-custom-load/generators/ticker.js)
```typescript
{
  type: "v2/ticker";
  symbol: string;                    // "BTCUSD"
  close: number;                     // last price (use this)
  open: number;
  high: number;
  low: number;
  mark_price: string;
  spot_price: string;
  volume: number;
  turnover: number;
  funding_rate: string;
  ltp_change_24h: string;           // "1.0123" → multiplier, NOT percentage
  mark_change_24h: string;
  timestamp: number;                 // microseconds (Date.now() * 1000)
  quotes: {
    best_ask: string;
    best_bid: string;
    ask_size: string;
    bid_size: string;
    // ...more fields
  };
  // ...many more fields (contract_type, greeks, oi, etc.)
}
```

> [!WARNING]
> `ltp_change_24h` is a **multiplier** around 1.0 (e.g., `"1.0123"` = +1.23%, `"0.9877"` = −1.23%). We must compute `(parseFloat(ltp_change_24h) - 1) * 100` to get the percentage.

### `l2_orderbook` — [l2_orderbook.js](file:///Users/rishabhgaur/Desktop/assignment/socket-custom-load/generators/l2_orderbook.js)
```typescript
{
  type: "l2_orderbook";
  symbol: string;
  bids: [string, string][];    // [price, size][] — 500 levels, highest first
  asks: [string, string][];    // [price, size][] — 500 levels, lowest first
  timestamp: number;           // microseconds
}
```

- Prices and sizes are **strings** (need `parseFloat`)
- 500 levels each side = 1000 entries per message
- Bids: descending by price (highest bid first)
- Asks: ascending by price (lowest ask first)

### `all_trades` — [all_trades.js](file:///Users/rishabhgaur/Desktop/assignment/socket-custom-load/generators/all_trades.js)
```typescript
{
  type: "all_trades";
  symbol: string;
  price: string;               // string
  size: number;                // integer (~96–110)
  buyer_role: "maker" | "taker";
  seller_role: "maker" | "taker";
  timestamp: number;           // microseconds
  product_id: number;
}
```

> [!NOTE]
> Trade side is determined by `buyer_role`: if `buyer_role === "taker"` → buy (aggressor is buyer); if `seller_role === "taker"` → sell. This maps to how real exchanges report trade sides.

---

## Symbol Precision & Grouping Options

| Symbol | Precision | Price Range | Grouping Increments |
|--------|-----------|-------------|---------------------|
| BTCUSD | 1 dp | 60,000–65,000 | 1, 5, 10, 50, 100, 500 |
| ETHUSD | 2 dp | 1,500–2,000 | 0.50, 1, 5, 10, 50 |
| XRPUSD | 4 dp | 1.0–2.0 | 0.0001, 0.001, 0.01, 0.1 |
| SOLUSD | 4 dp | 70.0–80.0 | 0.0001, 0.001, 0.01, 0.1 |
| PAXGUSD | 2 dp | 5,000–5,500 | 0.50, 1, 5, 10, 50 |
| DOGEUSD | 6 dp | 0.0–0.1 | 0.000001, 0.00001, 0.0001, 0.001 |

> [!NOTE]
> The assignment specifies XRPUSD grouping as `0.0001, 0.001, 0.01, 0.1`. SOLUSD (also 4 dp) and DOGEUSD (6 dp) must be "similarly derived." PAXGUSD (2 dp) should follow ETHUSD's pattern.

---

## Frontend Setup (Current State)

| Aspect | Status |
|--------|--------|
| Framework | React 18.3 + TypeScript 5.6 |
| Bundler | Vite 5.4 |
| Styling | Tailwind CSS v4.3 (already configured with `@tailwindcss/vite` plugin) |
| Testing | Vitest 4.1 + happy-dom + React Testing Library + `vitest-websocket-mock` |
| Linting | ESLint 9 + typescript-eslint + react-hooks + react-refresh |
| App State | Blank — default Vite template (counter example) |
| Design Tokens | Already defined: dark theme colors (bg-base, bg-panel, green/red for trading) |

The repo is **essentially a fresh Vite + React + TS scaffold** with Tailwind v4, testing infrastructure, and trading-oriented color tokens already in place. Ready for architecture work.

---

## Key Technical Challenges

### 1. Render Isolation (30% of evaluation)
The #1 evaluated criterion. A BTCUSD ticker update must NOT cause ETHUSD ticker, the order book, or trades feed to re-render.

**Strategy:** Per-symbol atoms/stores. Each ticker component subscribes to only its own symbol's data. The order book and trades feed subscribe only to focused-product data. Use separate state stores (Zustand slices or per-symbol refs) rather than a single monolithic state.

### 2. Order Book Grouping Pipeline (20% of evaluation)
The "deceptively complex" part. Must transform raw 500-level data → grouped/aggregated levels → cumulative sizes → depth bars → spread/imbalance metrics. This pipeline runs on every update (10–50 Hz).

**Key decisions:**
- Use `useMemo` with stable references, or move computation to a Web Worker?
- The grouping function is pure math: `Math.floor(price / groupIncrement) * groupIncrement` for bids, `Math.ceil(price / groupIncrement) * groupIncrement` for asks
- Must handle floating-point precision carefully (XRPUSD at 4dp, DOGEUSD at 6dp)
- Flash detection requires comparing previous grouped sizes to current

### 3. Trade Firehose (200+ trades/sec under stress)
- **100ms trade aggregation**: same price within 100ms → merge (combined size + count)
- **Render batching**: `requestAnimationFrame` throttle to ~16ms frames
- **Virtualization**: Only render visible rows; use a windowed list
- **Rolling stats**: 60-second sliding window with efficient stale-entry pruning (circular buffer or sorted deque)

### 4. WebSocket Lifecycle
- Single connection, multiplex all 8 subscriptions
- On product switch: unsubscribe old OB+trades, subscribe new, show loading, clear stale data
- Exponential backoff reconnection with visual indicator
- Handle backend restart without page refresh

### 5. Performance Under Extreme Stress
- Backend can be cranked to trades at 1–5ms, orderbook at 10–20ms
- App doesn't need to render every message, but must not freeze or leak memory
- Strategy: decouple message ingestion (always process) from rendering (throttle via rAF)

---

## Architectural Decisions to Make

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **State Management** | Zustand / Jotai / useRef+useSyncExternalStore / Redux | **Zustand** — lightweight, supports slices for isolation, selector-based re-renders |
| **WS Message Processing** | Main thread / Web Worker | **Main thread with rAF throttle** (simpler; Worker adds serialization overhead for 1000-level arrays). Consider Worker only if profiling shows issues |
| **Trade Virtualization** | react-window / @tanstack/virtual / custom | **@tanstack/react-virtual** — modern, small, well-maintained |
| **Order Book Rendering** | Static list / Virtualized | **Static list** (typically showing ~20 levels; virtualization overhead not worth it) |
| **CSS Approach** | Keep Tailwind v4 (already set up) | **Keep Tailwind v4** — it's already configured, fast to iterate |

---

## Open Questions for You

1. **Tailwind v4 is already set up.** The assignment says "everything else is your choice." Should we keep Tailwind, or do you prefer vanilla CSS?

2. **Zustand for state management** — are you comfortable with this, or do you have a preference (Jotai, Redux Toolkit, etc.)?

3. **Do you want any additional libraries** beyond what I'd propose? (e.g., a charting library, or keeping things minimal?)

4. **Commit strategy** — the assignment says "commit early and often, meaningful history." Should I outline commits, or will you manage that yourself?

5. **Architecture doc** — do you want me to produce this as we build, or as a final deliverable?

---

## Proposed Next Steps

### Phase 1: Foundation & WebSocket Layer
- Set up TypeScript types for all payload shapes
- Build the WebSocket manager (singleton, reconnect with backoff, subscription management)
- Build the state architecture (Zustand stores with per-domain isolation)
- Connection status indicator component

### Phase 2: Ticker Bar
- Per-symbol ticker atoms with memoized selectors
- Ticker bar component with selection persistence (localStorage)
- Verify render isolation with React DevTools

### Phase 3: Order Book
- Raw data ingestion → grouping pipeline → derived metrics
- Grouping dropdown with symbol-specific options
- Spread/imbalance calculations
- Flash highlighting on size changes
- Depth bar visualization

### Phase 4: Trades Feed
- Trade aggregation (100ms window, same price)
- rAF-throttled render batching
- Virtualized scrolling with "Jump to latest"
- Large trade highlighting (user-configurable threshold)
- Rolling stats bar (60s sliding window)

### Phase 5: Polish & Stress Testing
- Run backend at stress intervals, profile with React DevTools
- Memory leak audit
- Architecture document
- Final cleanup and README
