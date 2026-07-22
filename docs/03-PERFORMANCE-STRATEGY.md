# Performance Strategy: Delta Trading Dashboard

## Philosophy
The backend is explicitly designed to push a "data firehose" at aggressive rates (e.g., trades at 1-5ms intervals, order books at 10-20ms). 
Our philosophy is **Ingest Everything, Render Selectively**. We cannot map every WebSocket message to a React state update; doing so would overwhelm the main thread and cause layout thrashing. Instead, we decouple the data ingestion rate from the UI rendering rate.

## 1. Single Shared WebSocket & Message Routing
- **One Connection:** We maintain exactly one WebSocket connection for all channels (tickers, orderbook, trades).
- **Synchronous Parsing:** When a message arrives, we `JSON.parse` it immediately.
- **Direct Store Mutations:** The WebSocket manager bypasses React entirely, pushing parsed data directly into a mutable "pending updates" buffer or updating a transient Zustand store slice that isn't directly bound to heavy UI components.

## 2. Decoupling Ingestion from Rendering (Render Frequency)
React should not render faster than the screen's refresh rate (typically 60Hz or ~16.6ms).
- **Throttling Updates:** We will use `requestAnimationFrame` (rAF) or a strict `setInterval` (e.g., 50ms / 20fps) to flush the pending data buffer into the React-reactive Zustand store.
- **Why this works:** If the backend sends 10 trade messages in 16ms, we batch them in the buffer. When the flush occurs, React only processes one state update containing the combined results, maintaining 60FPS.

## 3. Buffering and Trade Aggregation
- **100ms Trade Merging:** The assignment requires trades at the same price within 100ms to be merged. We handle this in our mutable buffer. When a new trade arrives, we compare it against the latest buffered trade. If it matches the criteria, we mutate the size and count of the existing trade object rather than creating a new one.
- **Batching:** When the rAF flush occurs, the entire aggregated array is committed to the store.

## 4. Bounding Memory (Memory Leaks)
- **Trade History Limit:** If trades arrive at 5ms for an hour, pushing them all to an array will crash the browser. We will strictly cap the trade history array length (e.g., max 1000 items) inside the store reducer.
- **Rolling Stats (60s Window):** We will maintain a separate array of trades specifically for the 60s rolling stats. A scheduled job will periodically (e.g., every 1s) `filter` out timestamps older than `Date.now() - 60000` to prevent memory unbounded growth.

## 5. Order Book Snapshot Processing
- The backend sends full 500-level snapshots (1000 items) every 10-40ms. It does not send deltas.
- **Efficient Grouping:** The grouping logic requires math (`Math.floor` / `Math.ceil`), summing sizes across levels, and calculating cumulative totals.
- **In-Memory Transformation:** We apply this transformation *before* pushing to the React store. We iterate the raw snapshot exactly once to group and calculate cumulative sizes simultaneously, yielding a smaller processed array (typically ~20-50 visible levels) that React will actually render.
- **Flashing:** The grouping function will keep a reference to the previous processed book to detect >10% size changes and attach a `flashIndicator` boolean to the level.

## 6. Main Thread vs. Web Workers
- **Decision:** We will **not** use Web Workers initially.
- **Reasoning:** While Web Workers offload processing, moving 1000-item arrays back and forth via `postMessage` incurs serialization overhead. Given that V8 can execute a single `O(N)` pass over 1000 items in <1ms, the main thread is perfectly capable of handling this if we throttle the processing rate to 60Hz. If we processed every single 10ms message we might drop frames, but since we are batching/throttling, the main thread will easily keep up. We avoid Web Worker complexity unless profiling proves it necessary.
