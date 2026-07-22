# Tradeoffs, Decisions & Scaling: Delta Trading Dashboard

This document captures explicit design tradeoffs, the rationale behind key decisions, and a discussion of how the system would scale to significantly more symbols.

---

## 1. Where Should the CPU Work Happen?

This is the most fundamental architectural decision for a real-time data dashboard.

### The Three Options

| Option | CPU Location | Pros | Cons |
|---|---|---|---|
| **A. Synchronous in `onmessage`** | Main thread, immediate | Simple code | Blocks UI at high rates |
| **B. Main thread, batched (chosen)** | Main thread, deferred | Simple, fast enough, no serialization cost | Main thread still does the work |
| **C. Web Worker** | Off-main-thread | True parallelism, never blocks UI | `postMessage` serialization cost, complex architecture |

### Why We Chose Option B

**The `postMessage` problem.** Web Workers communicate via structured clone serialization. A 500-level order book snapshot is a 1,000-element array of `[string, string]` tuples. Serializing this, crossing the thread boundary, and deserializing it on the other side takes approximately **1-3ms per message**. The actual processing (grouping, cumulative sum) takes **< 1ms**. The cure would be more expensive than the disease.

**The flush rate makes B viable.** If we processed every message immediately, Option A would saturate the main thread at 200+ messages/second. But with the 100ms flush, we process at most **10 batches/second**. Each batch takes < 2ms. That means the order book processing claims **< 2% of the main thread's time budget**. There is ample headroom.

**The right threshold for reconsideration.** If profiling shows consistent > 8ms processing per flush (half the 16ms paint budget), the calculus changes. Transferable ArrayBuffers (zero-copy message passing) could also change the serialization cost equation at that point.

---

## 2. Index Keys vs. Stable ID Keys in Trade Feeds

### The Tradeoff

Using `trade.id` as a React key is semantically "correct" — React can track individual trade objects across renders. But it causes severe **Cumulative Layout Shift (CLS)** in a prepend-heavy feed.

**Root cause:** When `unshift` prepends a new trade, every existing key in the list shifts one position. React interprets this as: remove the last element, insert a new element at the top. The DOM physically changes — 49 rows' Y-coordinates change simultaneously.

Using `index` as a key means: React reconciles position 0 with position 0, position 1 with position 1. The DOM nodes stay put. Text content is mutated in place. Zero layout shift.

**When index keys are unsafe:** Reorderable lists, sortable tables, lists with per-item animations. None of these apply here — the feed is strictly ordered newest-first and items do not animate individually.

**Measured impact:** CLS dropped from **3.93 → 0.00** after this single-line change.

---

## 3. `setInterval` vs. `requestAnimationFrame` for Flushing

| `rAF` | `setInterval(100ms)` |
|---|---|
| Synchronized with paint cycle | Fixed wall-clock interval |
| ~60Hz (16.6ms) | 10Hz (100ms) |
| Pauses when tab is hidden | Continues (can be throttled by browser) |
| More renders, lower latency | Fewer renders, coarser timing |

For a financial data feed, **10 FPS is imperceptible** to a human reading prices. The difference between seeing a price update at 16ms vs. 100ms is not meaningful. The tradeoff is lower CPU usage and simpler code with the fixed interval.

If sub-100ms visual latency were required (e.g., algorithmic trading UI), switching to `rAF` would be the first optimization.

---

## 4. Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Full order book snapshots (no deltas) | Higher network bandwidth than necessary | Backend design decision; grouping reduces DOM work |
| `pruneOldTrades` uses polling | Slightly inaccurate 60s boundary (±5s) | Acceptable for display stats; not used for trading |
| Single WebSocket connection | Backend must multiplex all symbols | This matches the backend's actual design |
| No offline persistence | Reload loses all trade history | Out of scope for this assignment |
| Max 10 reconnect attempts | Permanent failure after ~5 minutes down | Configurable; would use circuit breaker in production |

---

## 5. Scaling to Significantly More Symbols

The current architecture supports 6 symbols. Here is how it would scale to 50 or 500 symbols.

### What Breaks at Scale

**Ticker subscriptions:** Currently all 6 symbols are subscribed on mount. At 500 symbols, the `v2/ticker` update rate would be overwhelming. The ticker buffer would contain hundreds of updates per flush.

**Order book:** Only one symbol's order book is shown at a time — this does not change with more symbols. No issue here.

**Memory in `tickerStore`:** A `Record<SymbolId, TickerMessage>` with 500 keys is trivially small (~50KB). Not an issue.

**The TickerBar UI:** Rendering 500 ticker cards simultaneously would be expensive. Virtualization would be needed.

### Scaling Solutions

| Problem | Solution |
|---|---|
| 500 simultaneous ticker subscriptions | Subscribe only to the visible/watchlisted symbols; lazy-subscribe on scroll |
| TickerBar rendering 500+ cards | Virtual list (`@tanstack/react-virtual`) — only render visible cards |
| Ticker update flood in buffer | Deduplicate by symbol in `tickersBuffer` (keep only latest per symbol) |
| Symbol switching UX | Symbol search modal with fuzzy search instead of a flat list |
| Multiple order books | Cache last-seen order book per symbol in a `Map<SymbolId, ProcessedBook>` for instant switching |

### Deduplication in the Ticker Buffer

The current `tickersBuffer` is a simple array. At 500 symbols × 10 updates/second = 5,000 entries per 100ms flush. This should be changed to a `Map` deduplication strategy:

```typescript
// Before flush
let tickersMap = new Map<SymbolId, TickerMessage>();

onMessage: (msg) => {
  if (msg.type === 'v2/ticker') {
    tickersMap.set(msg.symbol, msg); // Overwrites, keeping only latest
  }
}

// On flush
if (tickersMap.size > 0) {
  useTickerStore.getState().updateTickers(Array.from(tickersMap.values()));
  tickersMap.clear();
}
```

This reduces the per-flush work from O(N×updates) to O(N) regardless of update rate.

### Web Workers at Scale

At 500 symbols with 10ms order book updates per symbol (if all were subscribed), the main-thread processing load would grow linearly. At this point, a Worker Pool pattern becomes justified:

- Dedicated worker for order book processing
- Dedicated worker for trade aggregation  
- `SharedArrayBuffer` or Transferable for zero-copy data handoff
- Main thread handles only rendering and user interaction

---

## 6. Security Considerations (Production Notes)

| Concern | Current State | Production Fix |
|---|---|---|
| WebSocket endpoint hardcoded | `ws://localhost:8080` | Environment variable, TLS (`wss://`) |
| No authentication | None | JWT in WebSocket handshake headers |
| No rate limiting on client | Trusts all backend data | Schema validation on all incoming messages |
