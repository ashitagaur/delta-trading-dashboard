# Implementation Plan: Delta Trading Dashboard

This document breaks down the development of the Delta Trading Dashboard into 16 logical phases, ensuring a progressive build from foundational transport/state layers to complex UI components and performance optimizations.

---

### Phase 1: Project Foundation & Dependencies
- **Objective:** Scaffold the necessary tools and libraries to support our architecture.
- **Files expected to change:** `package.json`, `tailwind.config.js` (or `index.css`), `tsconfig.json`
- **Implementation scope:** Install Zustand for state management, `@tanstack/react-virtual` for virtualization, and `clsx`/`tailwind-merge` for class handling. Verify Tailwind v4 setup.
- **Verification steps:** Run `npm run dev` to ensure the skeleton builds successfully without dependency errors.
- **Suggested Git commit message:** `chore: add core dependencies for state and virtualization`

### Phase 2: Typings & Constants Definition
- **Objective:** Establish a strongly-typed contract for all incoming WebSocket messages and shared constants.
- **Files expected to change:** `src/types/ws.ts`, `src/constants/symbols.ts`
- **Implementation scope:** Define TypeScript interfaces for Ticker, OrderBook, and Trade payloads matching the backend generators. Define precision rules, grouping intervals, and default symbol configurations.
- **Verification steps:** `tsc --noEmit` completes without errors.
- **Suggested Git commit message:** `feat: define core websocket payload types and symbol constants`

### Phase 3: Core Utility Functions
- **Objective:** Implement pure math functions required for grouping and aggregating data.
- **Files expected to change:** `src/utils/orderbook.ts`, `src/utils/trades.ts`, `src/utils/format.ts`
- **Implementation scope:** Write the grouping math for the order book (handling floating-point issues), the 100ms trade aggregation logic, and currency formatters.
- **Verification steps:** Write basic unit tests to confirm precision accuracy and aggregation boundary conditions.
- **Suggested Git commit message:** `feat: implement pure utilities for data formatting and aggregation`

### Phase 4: State Management Skeleton
- **Objective:** Set up the isolated Zustand stores that will house our application state.
- **Files expected to change:** `src/store/connectionStore.ts`, `src/store/uiStore.ts`, `src/store/tickerStore.ts`, `src/store/orderbookStore.ts`, `src/store/tradesStore.ts`
- **Implementation scope:** Create the basic stores with initial states and setter actions. Do not implement complex selectors yet, just the containers.
- **Verification steps:** Check that the stores can be imported and initialized without errors.
- **Suggested Git commit message:** `feat: initialize zustand stores for data domains`

### Phase 5: WebSocket Transport Layer
- **Objective:** Establish the raw connection and subscription mechanisms.
- **Files expected to change:** `src/services/WebSocketManager.ts`
- **Implementation scope:** Build a singleton class that opens the connection, exposes `subscribe`/`unsubscribe` methods, builds the JSON payload, and handles basic incoming message parsing (routing to `console.log` temporarily).
- **Verification steps:** Run the backend and frontend simultaneously, verify the console logs successful subscription and message receipt.
- **Suggested Git commit message:** `feat: implement base websocket singleton and connection lifecycle`

### Phase 6: WebSocket Ingestion & Throttling
- **Objective:** Connect the raw WebSocket stream to the Zustand stores via a throttled buffer.
- **Files expected to change:** `src/services/WebSocketManager.ts`
- **Implementation scope:** Introduce the mutable buffer for incoming messages. Implement the `requestAnimationFrame` loop that flushes the buffer to the corresponding Zustand setter actions.
- **Verification steps:** Observe Redux/Zustand DevTools to ensure state updates are occurring at roughly 60Hz instead of every 1-5ms.
- **Suggested Git commit message:** `perf: add raf throttling and batched state ingestion for ws messages`

### Phase 7: Layout Shell & Design Tokens
- **Objective:** Create the main visual grid and theme base.
- **Files expected to change:** `src/App.tsx`, `src/index.css`, `src/components/Layout/Dashboard.tsx`
- **Implementation scope:** Configure Tailwind tokens (colors, fonts). Set up a responsive CSS Grid layout defining areas for the Ticker Bar (top), Order Book (left), and Trades Feed (right).
- **Verification steps:** Visually inspect the wireframe layout in the browser.
- **Suggested Git commit message:** `feat: establish dashboard layout grid and design tokens`

### Phase 8: Ticker Bar Implementation
- **Objective:** Build the multi-product ticker display with strict render isolation.
- **Files expected to change:** `src/components/TickerBar/TickerBar.tsx`, `src/components/TickerBar/TickerCard.tsx`
- **Implementation scope:** `TickerBar` maps over constant symbols. `TickerCard` uses a strict selector against `useTickerStore`. Implement the visual styling and color-coded 24h change (derived from the multiplier).
- **Verification steps:** Use React DevTools Profiler to confirm that updating BTCUSD does not cause ETHUSD's component to re-render.
- **Suggested Git commit message:** `feat: build isolated ticker components`

### Phase 9: Order Book Processing Pipeline
- **Objective:** Integrate the grouping logic directly into the state ingestion pipeline.
- **Files expected to change:** `src/store/orderbookStore.ts`, `src/components/OrderBook/GroupingSelector.tsx`
- **Implementation scope:** When the throttled flush occurs, pass the raw snapshot through the grouping utility based on the currently selected grouping interval (from `uiStore`). Calculate cumulative sizes and max depths. Set up the dropdown UI to change this grouping.
- **Verification steps:** Change grouping in the UI and verify that the stored order book arrays correctly transform and reduce in size.
- **Suggested Git commit message:** `feat: integrate dynamic grouping pipeline into order book store`

### Phase 10: Order Book UI & Flash Highlights
- **Objective:** Render the processed order book data visually.
- **Files expected to change:** `src/components/OrderBook/OrderBookPanel.tsx`, `src/components/OrderBook/LevelRow.tsx`, `src/components/OrderBook/SpreadMetrics.tsx`
- **Implementation scope:** Render asks (descending) and bids (descending). Implement the visual depth bar logic. Compare previous sizes during grouping to toggle CSS classes for red/green flashing on size changes. Render spread and imbalance metrics.
- **Verification steps:** Verify no flicker occurs during rapid updates and depth bars scale accurately relative to cumulative size.
- **Suggested Git commit message:** `feat: render order book ui with depth bars and flash highlighting`

### Phase 11: Trades Aggregation Pipeline & Stats Engine
- **Objective:** Process raw trades for UI presentation and statistics.
- **Files expected to change:** `src/store/tradesStore.ts`
- **Implementation scope:** Apply the 100ms merge logic upon ingestion. Implement the rolling 60-second window: maintain a queue of trades and prune elements older than 60s on an interval, updating average size, buy/sell volume, and count.
- **Verification steps:** Verify via console or debugger that the rolling stats correctly drop stale trades and the history array doesn't grow infinitely.
- **Suggested Git commit message:** `feat: implement trade aggregation and rolling 60s stats engine`

### Phase 12: Trades Feed UI
- **Objective:** Render the high-velocity trades feed efficiently.
- **Files expected to change:** `src/components/TradesFeed/TradesFeed.tsx`, `src/components/TradesFeed/TradeRow.tsx`
- **Implementation scope:** Implement `@tanstack/react-virtual` for the trade list. Implement auto-scrolling logic that suspends when the user scrolls up and displays a "Jump to latest" button. Render the rolling stats header and highlight large trades.
- **Verification steps:** Scroll up while data is flowing; ensure scrolling is smooth (60fps) and the jump button appears. Click it to snap back.
- **Suggested Git commit message:** `feat: build virtualized trades feed with auto-scroll and rolling stats`

### Phase 13: Focus Sync & Subscription Lifecycle
- **Objective:** Tie everything together so clicking a ticker syncs the panels and the WebSocket.
- **Files expected to change:** `src/components/TickerBar/TickerCard.tsx`, `src/services/WebSocketManager.ts`, `src/store/uiStore.ts`
- **Implementation scope:** When a user clicks a ticker, update `useUIStore.focusedSymbol`. Have a `useEffect` (or subscriber) observe this change: it should command the `WebSocketManager` to unsubscribe from the old symbol's OB/Trades, subscribe to the new one, and clear the local Zustand arrays to show a loading state. Persist the focused symbol to `localStorage`.
- **Verification steps:** Click different symbols; watch the WS payload in the network tab. Ensure no stale data flashes on the UI.
- **Suggested Git commit message:** `feat: implement active symbol switching and WS lifecycle sync`

### Phase 14: Error Recovery & Reconnect
- **Objective:** Ensure application resilience.
- **Files expected to change:** `src/services/WebSocketManager.ts`, `src/components/Shared/ConnectionStatus.tsx`
- **Implementation scope:** Implement exponential backoff in the WebSocket manager's `onclose` handler. On reconnect, automatically resend active subscriptions. Build a small UI indicator (green=connected, yellow=reconnecting, red=disconnected).
- **Verification steps:** Kill the backend server, observe the UI transition to reconnecting. Restart backend, ensure data resumes automatically without refreshing the page.
- **Suggested Git commit message:** `feat: add robust ws reconnection and status indicator`

### Phase 15: Unit & Component Testing
- **Objective:** Validate critical pathways to meet evaluation criteria.
- **Files expected to change:** `src/utils/*.test.ts`, `src/components/*.test.tsx`
- **Implementation scope:** Write Vitest tests for the order book grouping math (testing edge cases on XRPUSD/DOGEUSD precision). Test the 100ms trade aggregation logic. 
- **Verification steps:** Run `npm run test` and verify coverage on the utility functions.
- **Suggested Git commit message:** `test: add unit tests for critical data processing logic`

### Phase 16: Documentation & Final Polish
- **Objective:** Deliver the final required architecture documentation and clean up code.
- **Files expected to change:** `README.md`, `docs/ARCHITECTURE.md`
- **Implementation scope:** Ensure the architecture document fully covers the tradeoffs, scaling answers, and performance strategies used. Audit code for lingering `console.log` or `any` types. Verify production build.
- **Verification steps:** `npm run build` completes successfully.
- **Suggested Git commit message:** `docs: finalize architecture document and project readme`
