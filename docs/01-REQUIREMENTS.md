# Project Requirements: Real-Time Trading Dashboard

## Core Problem Statement
To build a resilient, high-performance real-time cryptocurrency trading dashboard that connects to a high-frequency WebSocket data firehose. The dashboard must maintain strict rendering isolation, efficient data transformation, and responsive UI under extreme stress conditions. The project is designed to evaluate architectural depth, state management under pressure, and performance optimization rather than a broad feature set.

## Mandatory Functionality

### Section 1: Multi-Product Ticker Bar
- **Visibility:** Always visible, subscribing to all 6 provided symbols simultaneously.
- **Data Points:** Display symbol name, last traded price, and color-coded 24h percentage change (derived from multiplier).
- **Interactivity:** Clicking a ticker sets it as the "focused" product. This selection must be visually highlighted and persist across browser reloads.
- **Isolation:** Strict render isolation is required. An update to one ticker must not cause other tickers to re-render.

### Section 2: Live Order Book (Focused Symbol)
- **Structure:** Display asks on top (lowest price first) and bids on the bottom (highest price first).
- **Data Points:** Show price, size, cumulative size, and a visual depth bar for each level.
- **Metrics:** Display mid-price, absolute spread, spread in basis points, and order book imbalance (bid vs. ask volume).
- **Grouping/Aggregation:** 
  - Provide a symbol-specific grouping dropdown to aggregate price levels dynamically based on symbol precision.
  - Grouping must dynamically recalculate sizes, cumulative sizes, depth bars, and metrics on every update (10-50Hz) without performance drops.
- **Flash Highlights:** Briefly flash a row green or red when its size increases or decreases by more than 10%.
- **Stability:** Prevent flicker, layout shifts, or scroll jumping during rapid updates. Note: The backend sends full 500-level snapshots, not deltas.

### Section 3: Live Trades Feed (Focused Symbol)
- **Structure:** A scrolling feed of recent trades.
- **Data Points:** Show time (HH:MM:SS.ms), price, size, and side (buy=green, sell=red).
- **Aggregation:** Merge trades occurring at the exact same price within a 100ms window, displaying combined size and trade count.
- **Highlighting:** Distinctly highlight large trades that exceed a user-configurable notional threshold.
- **Scrolling Behavior:** Auto-scroll to the latest trade. If the user scrolls up, suspend auto-scroll and show a "Jump to latest" button.
- **Rolling Stats:** Maintain a rolling statistics bar updating every second to show buy/sell volume, trade count, and average trade size over the last 60 seconds.

## User Interactions
- Click tickers to switch the focused product, driving updates to the order book and trades feed.
- Adjust order book grouping intervals via a dropdown menu.
- Configure the threshold for highlighting large trades.
- Manually scroll the trades feed and use "Jump to latest" to resume auto-scrolling.

## Real-Time Data Requirements and Constraints
- **WebSocket Multiplexing:** Use a single WebSocket connection for all subscriptions (tickers, order book, trades).
- **Lifecycle Management:** Gracefully handle subscription and unsubscription when switching the focused product, clear stale data to prevent visual flashes, and show loading states.
- **Resilience:** Implement automatic reconnection with exponential backoff and a visible connection status indicator. Ensure the UI recovers smoothly if the backend restarts.

## Performance Expectations Under Stress
- **Extreme Load Handling:** The application must remain highly responsive without freezing or leaking memory when backend update rates are cranked to 1-5ms for trades and 10-20ms for the order book.
- **State Isolation:** Order book updates must not trigger trades feed re-renders, and ticker updates must not trigger panel re-renders. This will be strictly verified.
- **Efficient Compute:** Derived state (grouping, aggregations, rolling stats) must be computed efficiently and decoupled from UI rendering (e.g., using throttling or batching) to maintain 60 FPS.

## Success Criteria
- Flawless render isolation verified via React DevTools Profiler.
- Smooth, jank-free operation under the backend's extreme stress settings.
- Accurate, performant order book grouping calculations across various symbol precisions.
- Delivery of a mandatory 1-2 page Architecture Document outlining data flow, performance strategies, tradeoffs, and scaling considerations.
- A clean, logical Git commit history demonstrating problem decomposition.

## Explicit Non-Goals
- Building a complete, feature-rich trading terminal.
- Extensive visual design or UX polish beyond matching the structural layout of the provided wireframe.
- Handling local order execution, user accounts, or portfolios.
- Processing external data beyond the provided backend streams.
