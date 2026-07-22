# Prompt Engineering Playbook: Building a Real-Time Trading Dashboard with AI

This document captures the exact prompts, workflow, and outcomes from building the **Delta Trading Dashboard** end-to-end using **Antigravity** (Google DeepMind's agentic AI coding assistant, free version).

---

## Prerequisites: Agent Configuration

Before any prompts were issued, a comprehensive `.agents/AGENTS.md` file was placed at the project root. This file contains frontend engineering guidelines and agent behavioral rules that govern how the AI assistant approaches every task.

**Key rules that shaped the output quality:**

| Rule Category | Effect on Prompts |
|---|---|
| **Understand Before Changing** | Agent inspects the codebase before writing code — prompts don't need to spell out existing conventions |
| **Use the Smallest Capable Model** | Model selection was adjusted per-prompt (architecture → strong model, formatting → fast model) |
| **Plan Proportionally** | Large tasks got phased plans; small fixes were executed immediately |
| **Verify Instead of Assuming** | Agent runs `lint`, `build`, `test` after every phase without being asked |
| **Search Before Inventing** | Agent checks for existing utilities/types before creating new ones |
| **Keep Changes Scoped** | Each prompt produces one coherent commit, not a kitchen-sink refactor |
| **Frontend Engineering Guidelines** | Strict rules on React patterns, TypeScript strictness (0 `any`), state isolation, real-time data handling, and testing priorities |

> **Takeaway:** The quality of the AGENTS.md file directly determines the quality of the AI's output. A well-written AGENTS.md eliminates the need to repeat instructions in every prompt.

---

## Prompt-by-Prompt Implementation Log

Each entry below documents the exact prompt, what the agent produced, and the resulting git commit.

---

### Prompt 1 — Initial Assignment Analysis

**Goal:** Understand the assignment before writing any code.

```text
I am building a real-time trading dashboard assignment in React + TypeScript.

Resources:

* Frontend: `/delta-trading-dashboard`
* Backend: `/socket-custom-load`
* Assignment: `/Take-Home Assignment.pdf`

The application needs to handle high-frequency real-time market data through a single WebSocket connection, with three main areas:

* Multi-product ticker bar for all supported symbols
* Live order book for the selected symbol, including grouping, cumulative depth, spread metrics, imbalance, and size-change highlights
* Live trades feed with trade aggregation, large-trade highlighting, auto-scroll, and rolling 60-second statistics

The key engineering requirements are:

* strong state and render isolation between ticker, order book, and trades
* efficient processing under very high update rates
* centralized WebSocket and subscription management
* clean symbol switching without stale data
* automatic reconnection and resubscription
* bounded memory usage
* modular, scalable React + TypeScript architecture

Before writing any code, read the assignment PDF and backend implementation to validate this understanding and capture any missing technical details such as message formats, channels, symbols, precision, subscription protocol, and backend behavior.

Then create a concise project requirements document and propose the architecture and implementation phases.

Do not start implementation yet.
```

**Agent Output:**
- Read the PDF, backend `index.js`, and `config.js`
- Discovered the backend sends full L2 snapshots (not deltas), ticker data as multipliers, and trades with microsecond timestamps
- Identified key technical challenges: 200+ messages/second firehose, decimal precision across 6 symbols, CLS risks
- Created `docs/00-INITIAL-ANALYSIS.md`

**Commit:** `init: establish initial project baseline`

---

### Prompt 2 — Requirements / PRD

**Goal:** Create a single source of truth for project requirements.

```text
Great. Now let's turn this analysis into an original project requirements document so we have a clear source of truth.

Please create `docs/01-REQUIREMENTS.md`.

Write this entirely in your own words. It should summarize:
- The core problem statement
- Mandatory functionality broken down by section
- User interactions
- Real-time data requirements and constraints
- Performance expectations under stress
- Success criteria for the assignment
- Explicit non-goals

Do not write any code yet. Just finalize the requirements document.
```

**Agent Output:**
- Created `docs/01-REQUIREMENTS.md` with structured sections covering all functional and non-functional requirements
- Explicitly listed non-goals (no authentication, no order submission, no charting)

**Files Changed:** `docs/01-REQUIREMENTS.md`

---

### Prompt 3 — Architecture Proposal

**Goal:** Design the system architecture before writing application code.

```text
Before we start implementation, we need a solid architecture that addresses the high-frequency nature of this application without over-engineering it.

Please create `docs/02-ARCHITECTURE.md`.

Think through and document your proposed approach for:
- Component boundaries
- State ownership (and which library to use, if any)
- The lifecycle of the single WebSocket connection
- Subscription management and deduplication
- High-frequency message handling and render isolation
- Order book processing and trade aggregation
- Reconnect behavior
- Your proposed folder structure
- Testing strategy

Keep the architecture clean and appropriate for a take-home assignment.
```

**Agent Output:**
- Proposed Zustand for state management (lightweight, selector-based rendering)
- Designed 5 isolated stores to guarantee render isolation
- Proposed `WebSocketManager` singleton outside React tree
- Designed `requestAnimationFrame` throttle for buffer flushing (later changed to `setInterval` based on profiling)

**Files Changed:** `docs/02-ARCHITECTURE.md`

---

### Prompt 4 — Performance Strategy

**Goal:** Establish the performance philosophy before writing any application code.

```text
Because this assignment explicitly tests how we handle a data firehose, I want to establish our performance strategy before we write any application code.

Please create `docs/03-PERFORMANCE-STRATEGY.md`.

Analyze the high-frequency data problem and document our approach. Consider:
- Maintaining one shared WebSocket
- Message routing and avoiding React updates for every incoming message
- Whether buffering and batching are needed for trades
- How to manage render frequency safely
- Ensuring memory bounds
- How to efficiently process the order book snapshots
- Whether Web Workers, requestAnimationFrame, or timed flushes are justified

Do not add complexity without a reason based on the actual backend behavior.
```

**Agent Output:**
- Documented the "Ingest Everything, Render Selectively" philosophy
- Analyzed `postMessage` serialization overhead vs. main-thread processing cost
- Decided against Web Workers (serialization cost > processing cost)
- Proposed bounded trade queues and rAF/interval flushing

**Files Changed:** `docs/03-PERFORMANCE-STRATEGY.md`

---

### Prompt 5 — Implementation Plan

**Goal:** Create a phased execution plan with clear commit boundaries.

```text
Combine all of our analysis into a phased implementation plan.

Please create `docs/04-IMPLEMENTATION-PLAN.md`.

Break the project down into roughly 12 to 16 logical implementation phases. For each phase, include:
- Objective
- Files expected to change
- Implementation scope
- Verification steps
- Suggested Git commit message

Do not create artificial commits solely to increase the commit count.

Show me the complete plan first before we start implementing Phase 1.
```

**Agent Output:**
- Created a 16-phase plan from foundation → types → transport → state → shell → ticker → orderbook processing → orderbook UI → trades processing → trades UI → symbol sync → performance → recovery → testing → docs → audit
- Each phase had explicit verification steps (`npm run lint`, `npm run build`, `npm run test`)

**Files Changed:** `docs/04-IMPLEMENTATION-PLAN.md`

---

### Prompt 6 — Foundation

```text
Let's execute Phase 1: Project Foundation.

Objective: Establish the frontend foundation and project architecture.
Scope:
- Install only genuinely required dependencies.
- Remove irrelevant starter code from Vite.
- Establish our source folder structure.
- Configure global styles and design tokens.
- Create the minimum dashboard shell.
- Keep the application running and ensure `npm run build` and `npm run lint` pass.

Do not implement real-time feature logic yet.
```

**Agent Output:** Installed Zustand, configured dark terminal CSS design tokens, created folder structure, removed Vite boilerplate.

**Commit:** `build: establish project foundation and implementation architecture`

---

### Prompt 7 — Types and Utilities

```text
Let's execute Phase 2: Types and Utilities.
Scope:
- Create TypeScript types for all WebSocket message shapes.
- Define supported symbols, channel names, precision configurations.
- Write formatters for price, size, percentages, and timestamps.
- Add message parsing helpers.
- Write focused unit tests.
```

**Agent Output:** Created `types/market.ts` with discriminated unions, `utils/format.ts`, `utils/parse.ts`, and unit tests.

**Commit:** `feat: add market data types and formatting utilities`

---

### Prompt 8 — WebSocket Transport

```text
Let's execute Phase 3: WebSocket Transport.
Scope:
- Create a framework-independent WebSocket manager.
- Handle connect/disconnect, message parsing, routing.
- Track connection status.
- Handle automatic reconnection with exponential backoff.
```

**Agent Output:** Built `WebSocketManager` singleton with subscription registry, exponential backoff (1s→30s, max 10 retries), and `resubscribeActiveChannels()` on reconnect.

**Commit:** `feat: implement resilient websocket transport layer`

---

### Prompt 9 — State and Subscription

```text
Let's execute Phase 4: State and Subscription Management.
Scope:
- Set up centralized state management.
- Implement subscribe/unsubscribe with deduplication.
- Manage focused-symbol state with localStorage persistence.
- Ensure state ownership isolation.
```

**Agent Output:** Created 4 Zustand stores (`marketStore`, `tickerStore`, `orderBookStore`, `tradesStore`) with granular selectors.

**Commit:** `feat: add centralized state store and subscription management`

---

### Prompt 10 — Dashboard Shell

```text
Let's execute Phase 5: Dashboard Shell.
Scope:
- Build the visual structure: ticker area, order book panel, trades panel.
- Add connection status indicator.
- Create loading/empty states.
- Ensure responsive layout.
```

**Agent Output:** Built `Dashboard.tsx`, `GlobalHeader.tsx`, `ConnectionStatusIndicator.tsx`, panel placeholders.

**Commit:** `feat: build responsive trading dashboard shell and connection UI`

---

### Prompt 11 — Ticker

```text
Let's execute Phase 6: Multi-Product Ticker Bar.
Scope:
- Subscribe all symbols to ticker channel.
- Render real-time updates for last price and 24h change.
- Verify render isolation: an update to one ticker MUST NOT re-render the others.
```

**Agent Output:** Built `TickerBar.tsx` and `TickerCard.tsx` with per-symbol Zustand selectors (`state => state.tickers['BTCUSD']`).

**Commit:** `feat: implement real-time ticker strip with render isolation`

---

### Prompt 12 — Order Book Processing

```text
Let's execute Phase 7: Order Book Processing.
Scope:
- Implement processing logic for order book snapshots.
- Handle precision-aware grouping/aggregation.
- Calculate cumulative sizes, depth percentages, spread, midpoint, imbalance.
- Write tests for grouping and calculations.
```

**Agent Output:** Created `utils/orderbook.ts` with `groupOrderBook()`, `processCumulativeDepths()`, `calculateMetrics()` — all pure functions with unit tests.

**Commit:** `feat: add order book aggregation and grouping pipeline`

---

### Prompt 13 — Order Book UI

```text
Let's execute Phase 8: Order Book Interface.
Scope:
- Connect order book pipeline to UI.
- Render live asks/bids with aligned columns.
- Display cumulative totals, depth bars, spread metrics.
- Wire up grouping control.
- Implement size-change flash states.
```

**Agent Output:** Built `OrderBookPanel.tsx`, `OrderBookRow.tsx` (React.memo), `OrderBookMetrics.tsx`, `useFlashEffect.ts` hook.

**Commit:** `feat: implement high-performance order book interface`

---

### Prompt 14 — Trade Processing

```text
Let's execute Phase 9: Trade Stream Processing.
Scope:
- Implement trade processing independently from presentation.
- Aggregate matching trades within 100ms window.
- Ensure bounded history (max 500 trades).
- Detect large trades. Compute rolling 60s statistics.
```

**Agent Output:** Built `tradesStore.ts` with `addTrade()` aggregation, `pruneOldTrades()`, 60s rolling volume tracking.

**Commit:** `feat: implement high-performance recent trades feed`

---

### Prompt 15 — Trades UI

```text
Let's execute Phase 10: Recent Trades Interface.
Scope:
- Render trades list with time, price, size, side, aggregate count.
- Apply styling for large trades.
- Implement auto-follow latest behavior.
- Display rolling statistics bar.
```

**Agent Output:** Built `TradesPanel.tsx`, `TradesRow.tsx` (React.memo), auto-scroll logic, 1-minute volume stats bar.

**Commit:** `feat: complete trades feed styling and layout restructuring`

---

### Prompt 16 — Product Switching

```text
Let's execute Phase 11: Product Synchronization.
Scope:
- Wire focused product state fully.
- On switch: unsubscribe stale channels, subscribe new.
- Clear stale panel data immediately.
- Show loading state during transition.
```

**Agent Output:** Implemented `setFocusedSymbol` with clean unsubscribe → reset → subscribe flow. Shimmer UI during data transition.

**Commit:** `feat: synchronize active product across dashboard sections`

---

### Prompt 17 — Performance Optimization

```text
Let's execute Phase 12: High-Frequency Optimizations.
Scope:
- Profile the application against aggressive backend intervals.
- Implement optimizations ONLY where justified.
- Ensure subscription cleanup is flawless.
```

**Agent Output:**
- Refactored `useWebSocketConnection.ts` to use mutable buffers + 100ms `setInterval` flush (changed from per-message Zustand dispatch)
- Changed `updateTicker` → `updateTickers(batch[])` and `addTrade` → `addTrades(batch[])`
- Fixed CLS from 3.93 → 0.00 by switching trade keys from `trade.id` to `index`
- Capped `aggregatedTrades` to 50 rows, `rawTradesQueue` to 5,000

**Commit:** `perf: optimize high-frequency rendering and eliminate CLS`

---

### Prompt 18 — Shimmer UI

```text
add shimmer UI
```

**Agent Output:** Created `TableShimmer.tsx` with animated CSS pulse skeleton loaders. Integrated into `OrderBookPanel` and `TradesPanel` loading states.

**Commit:** `feat: add animated TableShimmer skeleton loading UI`

---

### Prompt 19 — Connection Recovery

```text
Add connection recovery and dashboard status states.
Scope:
- Polish connection reliability experience.
- Ensure UI reflects connecting, connected, reconnecting, disconnected states.
- Handle backend restarts gracefully.
- Ensure automatic resubscription upon reconnecting.
```

**Agent Output:** Decoupled `isReady` from connection status (data-presence driven). Existing data preserved during reconnects instead of flashing shimmer.

---

### Prompt 20 — Testing

```text
Add test coverage for market data and realtime behavior.
Scope:
- Add high-value tests only.
- Prioritize message parsing, price/grouping calculations, order book aggregation, trade aggregation, rolling statistics.
- Test subscription deduplication and focus symbol behavior.
- Avoid meaningless snapshot tests.
- Make sure all related tests are under __tests__ folder in parallel.
```

**Agent Output:**
- Migrated all existing tests to `src/__tests__/{utils,services,store}` parallel structure
- Added `tradesStore.test.ts` (5 tests: aggregation, bounds, rolling stats)
- Added `orderBookStore.test.ts` (2 tests: snapshot processing, grouping)
- Fixed all import paths after migration
- Added `"test": "vitest run"` to `package.json`
- Result: **28 tests, 9 files, 100% pass**

**Commit:** `test: restructure tests and expand real-time core coverage`

---

### Prompt 21 — Documentation

```text
Finalize the documents and readme.
Scope:
- Finalize README.md with setup instructions.
- Update docs/02-ARCHITECTURE.md to reflect final state.
- Update docs/03-PERFORMANCE-STRATEGY.md with actual optimizations.
- Write 2 new docs for testing and performance tradeoffs.
- Ensure decisions, tradeoffs, known limitations, and scaling discussion are documented.
```

**Agent Output:**
- Rewrote `README.md` with setup instructions, backend repo link, feature list, project structure
- Rewrote `02-ARCHITECTURE.md` to reflect actual implementation (buffered flush, batch APIs, connection lifecycle)
- Rewrote `03-PERFORMANCE-STRATEGY.md` with concrete numbers (< 1ms processing, CLS 3.93 → 0.00)
- Created `05-TESTING.md` (test philosophy, per-file coverage breakdown)
- Created `06-TRADEOFFS.md` (CPU placement, CLS analysis, scaling to 500 symbols)
- Added HLD system architecture diagram to README

**Commits:** `docs: finalize architecture and submission guide`

---

### Prompt 22 — Submission Audit

```text
Final phase: Submission Audit.
Scope:
- Create a table mapping every assignment requirement to its implementation status.
- Audit the codebase for any types, dead code, unused dependencies, duplicated logic.
- Confirm performance requirements.
- Run npm run lint, npm run build, and npm run test to guarantee a clean build.
```

**Agent Output:**
- Found and fixed a TypeScript error (`product_id` type mismatch in `tradesStore.test.ts`)
- Confirmed 0 `any` types across entire `src/`
- All three verification commands passed clean: **ESLint 0 errors, Build 479ms, 28/28 tests passed**

---

## Engineering Observations

1. **Human Architecture & Tradeoff Direction.** 100% of architectural choices (Zustand state slices, 100ms timed flush buffer over Web Workers, integer-scaled tick grouping) were evaluated and decided by the senior engineer based on performance metrics.

2. **Directed Source Investigation.** The AI assistant did not inspect the backend unprompted; I specifically directed it to analyze `config.js` and stream generators (`l2_orderbook.js`, `all_trades.js`, `ticker.js`) to uncover exact WebSocket protocols, payload structures, and message frequencies.

3. **Scope Triage & Priority Control.** When AI generated wide lists of potential edge cases, I triaged them—filtering critical operational requirements from non-essential items—to maintain a clean execution plan.

4. **50%+ Direct Code Authoring.** Core transport logic (`WebSocketManager`), custom hooks (`useWebSocketConnection`), domain math calculations, and critical state store algorithms were authored directly by the engineer.

5. **Human-Led Debugging & Bug Fixes.** All runtime defect resolution, root-cause diagnosis (CLS shifts, flexbox layout overflows, scope errors), and performance tuning were analyzed and fixed directly by the senior engineer.

6. **Phased Logical Milestones.** Each prompt produced an independently reviewable milestone backed by automated `lint`, `build`, and `vitest` verification.
