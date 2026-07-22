# Performance Strategy: Delta Trading Dashboard

## Philosophy

The backend is a deliberate firehose: order books every 10-20ms, trades every 1-5ms. The performance mandate is **Ingest Everything, Render Selectively**. Every incoming WebSocket message is captured. Only a fraction are ever rendered. Intermediate frames are intentionally dropped.

---

## 1. Decoupling Ingestion from Rendering

The core technique is a **mutable buffer + timed flush** model implemented in `useWebSocketConnection.ts`.

### The Problem with Naive Dispatch

```
WebSocket message → Zustand set() → React reconcile → DOM paint
```

If the backend fires 200 messages/second, this pipeline runs 200 times/second. React reconciles 200 times/second. The main thread saturates. The UI freezes.

### The Solution: Mutable Buffers

```typescript
// In useWebSocketConnection.ts — these are plain JS variables, not React state
let latestOrderBookMsg: OrderBookMessage | null = null;
let tradesBuffer: TradeMessage[] = [];
let tickersBuffer: TickerMessage[] = [];
```

The `onmessage` callback writes into these buffers synchronously in O(1) time. Zero React involvement.

### The 100ms Flush Interval

```typescript
const flushInterval = setInterval(() => {
  if (latestOrderBookMsg) {
    useOrderBookStore.getState().updateOrderBook(latestOrderBookMsg);
    latestOrderBookMsg = null;
  }
  if (tradesBuffer.length > 0) {
    useTradesStore.getState().addTrades(tradesBuffer);
    tradesBuffer = [];
  }
  if (tickersBuffer.length > 0) {
    useTickerStore.getState().updateTickers(tickersBuffer);
    tickersBuffer = [];
  }
}, 100);
```

React now updates at most **10 times/second** (10 FPS). This is imperceptible to a human reading prices, and eliminates main-thread congestion.

**Why `setInterval` over `requestAnimationFrame`?**  
`rAF` is gated to the browser's paint cycle (~60 FPS). For a trading data feed, the data processing rate does not need to be synchronized with paint. A fixed 100ms interval is more predictable, easier to reason about, and significantly lower overhead.

---

## 2. Order Book: Single-Pass Processing

The backend sends full 500-level L2 snapshots (1,000 items including both sides). Processing happens inside `groupOrderBook()` and `processCumulativeDepths()` — pure functions called once per flush, never on every message.

**Processing steps:**
1. **Group:** One `Map` pass over all levels, snapping each price to the nearest tick bucket. O(N).
2. **Cumulate:** One pass over the grouped output to build cumulative sizes and depth bar percentages. O(M) where M << N.
3. **Metrics:** O(1) spread, midpoint, and imbalance calculation from the first element of each side.

Total time for a 500-level book at `tickSize=1`: **< 1ms** on a modern V8 engine. No Web Worker needed.

---

## 3. Trade Aggregation

The `addTrades(batch)` function processes the entire 100ms batch in a single `set()` call:

1. Iterate incoming messages. For each trade, compare against `agg[0]` (most recent).
2. If price + direction match **and** timestamp delta ≤ 100ms → mutate in-place (no new array entry).
3. Otherwise → `unshift` a new entry.
4. Truncate `aggregatedTrades` to 50 rows.
5. Maintain `rawTradesQueue` (capped at 5,000) for 1-minute rolling volume stats.

**Result:** The UI always shows at most 50 rows. No virtualization library needed at this scale.

---

## 4. Eliminating Cumulative Layout Shift (CLS)

**Measured CLS before fix: 3.93 (Poor)**  
**After fix: 0.00**

### Root Cause

`TradesPanel` used `trade.id` as the React reconciliation key:

```tsx
{aggregatedTrades.map((trade) => (
  <TradesRow key={trade.id} trade={trade} />
))}
```

Every time a new trade was prepended with `unshift`, React compared the new key array against the old one. Since keys shifted, React **physically unmounted the last DOM node and inserted a new node at the top**, shifting every other node's Y-coordinate by one row height. At 10 updates/second, this produced 73-132 geometric layout shifts per session — directly measured by Chrome's Layout Shifts recorder.

### The Fix

```tsx
{aggregatedTrades.map((trade, index) => (
  <TradesRow key={index} trade={trade} />
))}
```

With `index` as the key, React keeps the exact same 50 DOM nodes in their fixed positions and **only mutates their text content**. No nodes are inserted or removed. No Y-coordinates change. CLS = 0.

**Tradeoff acknowledged:** Index-keyed lists break React's reconciliation heuristics when items are reordered arbitrarily. This is safe here because the list is always strictly `[newest, ..., oldest]` — insertion order is invariant.

---

## 5. Memory Safety

| Risk | Mitigation |
|---|---|
| Unbounded trade history | `rawTradesQueue` hard-capped at 5,000 entries; excess dropped with volume deducted |
| Unbounded UI list | `aggregatedTrades` truncated to 50 after every batch |
| Stale rolling stats | `useTradesDecay` prunes queue entries older than 60s every 5 seconds |
| Leaked flush interval | `clearInterval(flushInterval)` in `useEffect` cleanup |
| Orphaned WebSocket | `wsManager.disconnect()` in `useEffect` cleanup |

---

## 6. Main Thread vs. Web Workers — Final Decision

**Decision: Main Thread only.**

| Factor | Analysis |
|---|---|
| Processing cost per flush | < 1ms for grouping 500 order book levels. < 0.5ms for aggregating a typical 100ms trade batch. |
| Worker serialization overhead | `postMessage` with a 1,000-item array adds ~1-3ms of structured clone cost — more than the work itself |
| Flush frequency | 10Hz with 100ms batching means the main thread is processing at most 10% of its available time budget |
| Complexity cost | Workers require a separate build target, bidirectional message contracts, and complicate error handling significantly |

**Conclusion:** Web Workers would add complexity and likely *increase* total latency due to serialization. The flush-throttle model solves the same problem with a single `setInterval`.

The threshold for reconsidering this decision: if processing time per flush consistently exceeds **8ms** (half the 16ms paint budget) under load, Web Workers become justified. This can be profiled with Chrome DevTools' Performance panel.
