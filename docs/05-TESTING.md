# Testing Strategy: Delta Trading Dashboard

This document describes the testing philosophy, structure, coverage areas, and how to interpret results.

---

## Philosophy

> **Test what the business cares about. Ignore everything else.**

The application is a real-time data renderer. Its correctness depends on:

1. **Message parsing** — raw WebSocket payloads parsed to typed objects correctly.
2. **Number formatting** — prices and sizes formatted to the correct precision per symbol.
3. **Order book math** — grouping, cumulative depth, spread, and imbalance calculations.
4. **Trade aggregation logic** — 100ms merge window, rolling stats, memory bounds.
5. **WebSocket lifecycle** — subscription deduplication, reconnection, resubscription.
6. **Symbol switching** — correct channel management when focus changes.

We **do not** write:
- React DOM snapshot tests (brittle, test implementation not behavior)
- Tests for pure CSS or visual layout
- Integration tests that spin up a real WebSocket server

---

## Structure

All tests live in a strict **parallel mirror** of `src/`:

```text
src/
├── __tests__/
│   ├── services/
│   │   └── WebSocketManager.test.ts
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
```

This keeps test files out of the production `src` directories while maintaining a 1:1 correspondence with the files they test.

---

## Running Tests

```bash
npm run test          # Single run (vitest run)
npx vitest            # Watch mode
npx vitest --reporter verbose  # Verbose output
```

---

## Coverage Areas

### `utils/parse.test.ts`
- Valid JSON WebSocket payloads are parsed to typed objects.
- Invalid JSON returns `null` without throwing.
- `calculatePercentageChange` correctly converts the Delta multiplier format (e.g., `"1.0123"` → `+1.23%`).
- `getTradeSide` correctly derives `buy`/`sell` from `buyer_role`.

### `utils/format.test.ts`
- `formatPrice` respects per-symbol decimal precision (BTC: 1dp, ETH: 2dp, XRP: 4dp).
- `formatSize` applies K/M abbreviations correctly at the right thresholds.
- `formatPercentage` correctly signs and formats percentage strings.

### `utils/orderbook.test.ts`
- `groupOrderBook` correctly buckets bid prices **down** to the nearest tick.
- `groupOrderBook` correctly buckets ask prices **up** to the nearest tick.
- Prices that sit exactly on a tick boundary are handled without duplication.
- `processCumulativeDepths` produces correct cumulative sizes and depth percentages.
- `calculateMetrics` derives spread, midpoint, and imbalance ratio.

### `utils/trades.test.ts`
- `isBuyTrade` correctly identifies taker-buy vs. maker-sell semantics.
- `isLargeTrade` applies the $10,000 notional threshold correctly.

### `store/tradesStore.test.ts`

This is the highest-value test file — it validates the core real-time aggregation engine.

| Test | What it proves |
|---|---|
| Aggregates within 100ms | Trades at the same price within 100ms are merged into a single row with a correct `count` increment |
| Does not aggregate beyond 100ms | Trades separated by >100ms always create two separate rows |
| Rolling stats update correctly | `buyVolume1m` and `sellVolume1m` accumulate correctly per trade direction |
| 50-row bound enforced | `aggregatedTrades.length` never exceeds 50 |
| 5,000-entry raw queue bound | After 5,005 insertions, `rawTradesQueue.length === 5000` and the 5 dropped trades' volumes are correctly deducted from rolling stats |

### `store/orderBookStore.test.ts`
- Snapshot payloads correctly update `bids` and `asks` with processed price/size data.
- `setGroupTick(1)` re-processes the raw snapshot through the grouping function, correctly consolidating sub-tick prices into their buckets.

### `store/tickerStore.test.ts`
- `updateTickers([msg1, msg2])` correctly updates both symbols in one operation without overwriting unrelated symbols.

### `store/marketStore.test.ts`
- `setFocusedSymbol` persists to `localStorage`.
- Switching symbol correctly calls `unsubscribe` for the previous symbol's channels and `subscribe` for the new symbol's channels on the WebSocket manager.
- The `v2/ticker` channel is **never** touched during symbol switching (it is subscribed for all symbols on mount).

### `services/WebSocketManager.test.ts`
- `connect()` transitions status to `connecting`, then `connected` on open.
- `onclose` triggers `reconnecting` and schedules a retry via fake timers.
- `subscribe(channel, ['BTCUSD'])` called twice only sends **one** WebSocket payload (deduplication).
- `subscribe` with a new symbol sends a payload containing **only the new symbol**.
- Valid incoming messages are routed to the `onMessageReceived` callback.

---

## Test Infrastructure

| Tool | Role |
|---|---|
| **Vitest** | Test runner, assertions (`expect`), mocking (`vi.fn`, `vi.mock`, `vi.stubGlobal`) |
| **Fake Timers** (`vi.useFakeTimers`) | Test `setInterval` / `setTimeout` behavior without real clock delays |
| **Global Stub** (`vi.stubGlobal('WebSocket', ...)`) | Inject a mock WebSocket class for `WebSocketManager` tests |
| **Zustand direct state** (`useStore.setState(...)`) | Reset store state between tests without component rendering |
