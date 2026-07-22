# High-Frequency Crypto Trading Terminal

A real-time, multi-symbol crypto trading dashboard built with React + TypeScript + Vite. It connects to a local WebSocket mock server and displays live order book data, recent trades, and ticker information across 6 symbols simultaneously.

---

## Quick Start

### Prerequisites

- **Node.js** `>= 20.x`
- **npm** `>= 9.x`

### 1. Clone the Repository

```bash
git clone <repository-url>
cd delta-trading-dashboard
```

### 2. Start the Backend Mock Server

The backend WebSocket server lives in the `socket-custom-load` directory. 
You can clone it from: https://github.com/saxenanickk/socket-custom-load

```bash
cd ../socket-custom-load
node index.js
```

> The backend starts on `ws://localhost:8080`. It broadcasts tickers for all 6 symbols and streams order book snapshots and trades for the active symbol.

### 3. Start the Frontend Dev Server

Open a second terminal:

```bash
cd delta-trading-dashboard
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run lint` | Run ESLint across the entire project |
| `npm run test` | Run the full Vitest unit test suite |
| `npm run preview` | Preview the production build locally |

---

## Features

- **Live Order Book** — Full-depth streaming snapshots with configurable grouping (`0.5`, `1`, `5`, `10` tick sizes), animated depth bars, and spread/imbalance metrics
- **Real-Time Trades Feed** — 100ms trade aggregation with large-trade detection (🔥), rolling 1-minute volume statistics, and auto-scroll with manual override
- **Ticker Bar** — 6-symbol live ticker with 24h price change indicators
- **Symbol Switcher** — Click any ticker to instantly swap the active symbol; old subscriptions are cleanly unsubscribed
- **Connection Status** — Live indicator for `connecting`, `connected`, `reconnecting`, and `disconnected` states with automatic exponential-backoff reconnection
- **Shimmer Loading UI** — Animated skeleton loaders appear while initial data is in flight; existing data is preserved (not wiped) on reconnects
- **Footer Legend** — Inline explanations for every visual affordance in the UI

---

## How I Approached This

Before authoring application code, I audited the backend server implementation (`config.js` and stream generators) to verify exact protocol contracts. This upfront code inspection revealed critical data payload realities that dictated the frontend data pipeline:

| Backend Discovery / Finding | Impact on Frontend Implementation |
|---|---|
| **Order Book Tuples** (`[price, size]`) | Destructured array tuples directly instead of accessing `.price` properties. |
| **Microsecond Timestamps** (`timestamp`) | Converted timestamps (`/ 1000`) for 100ms trade aggregation windowing. |
| **Implicit Trade Execution Side** | Derived `buy`/`sell` side by evaluating `buyer_role` vs `seller_role`. |
| **Ticker 24h Multipliers** (`ltp_change_24h`) | Normalized decimal multipliers (e.g. `1.0234` → `+2.34%`) to display percentages. |
| **Symbol Precision Scale** | Dynamically scaled grouping tick buckets based on per-symbol precision (SOLUSD 4dp, DOGEUSD 6dp). |

### Core Architecture & Decisions
- **WebSocket & Subscription Ownership**: Centralized networking in a pure TypeScript `WebSocketManager` singleton outside React with exponential backoff (1s..30s, max 10 retries) and auto-resubscription on reconnect.
- **Decoupled 100ms Ingestion**: Pushed high-frequency socket events (200+ msg/sec) to mutable buffers, flushing to Zustand state every 100ms (10 FPS cap) to keep main-thread execution <1ms per frame.
- **Render & State Isolation**: Split state into 4 isolated Zustand stores (`market`, `ticker`, `orderBook`, `trades`). Zero-CLS in trade feed achieved by keying rows by `index` instead of `trade.id`.
- **Validation**: 28 Vitest unit tests across 9 suites, 0 ESLint warnings, and clean 465ms production Vite build.

---

## How I Used Gemini

Gemini accelerated parts of the workflow, but the codebase was not generated end-to-end and accepted as-is. I actively wrote, reviewed, modified, debugged, and refactored code throughout the implementation.

- **Where AI Assisted**: Scaffolding component layout boilerplates, generating unit test suite cases, and formatting markdown documentation.
- **Human Engineering Ownership**: Designed core architecture (`WebSocketManager`, 100ms flush hook, Zustand stores), authored pure domain math (`orderbook.ts`, `trades.ts`), diagnosed root-cause integration defects (CLS shifts, layout overflow, timestamp scaling), and made all technical tradeoff calls.

---

## Architecture & System Design

See [`docs/02-ARCHITECTURE.md`](./docs/02-ARCHITECTURE.md) for a detailed breakdown of component boundaries, state management, WebSocket lifecycle, and data processing pipelines.

### High-Level Design (HLD)

The system is designed around a **Single-Connection, Buffered Ingestion & Isolated Render** paradigm. High-frequency WebSocket data is decoupled from React's rendering pipeline via mutable buffers and a 100ms flush loop.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EXTERNAL SYSTEM                                          │
│                                                                                          │
│                  ┌──────────────────────────────────────────────────┐                    │
│                  │  WebSocket Server (ws://localhost:8080)          │                    │
│                  │  - Broadcasts tickers for 6 symbols              │                    │
│                  │  - Streams L2 Order Book & Trades for active sym │                    │
│                  └────────────────────────┬─────────────────────────┘                    │
└───────────────────────────────────────────┼──────────────────────────────────────────────┘
                                            │ Full-Duplex WebSockets (JSON Streams)
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT APPLICATION                                        │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ NETWORK & INGESTION LAYER                                                          │  │
│  │  ┌────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────┐ │  │
│  │  │ WebSocketManager       │   │ Reconnection Engine       │   │ Subscription    │ │  │
│  │  │ (Pure TS Singleton)    ├──►│ (Exp Backoff 1s..30s)     │   │ Registry Map    │ │  │
│  │  └───────────┬────────────┘   └───────────────────────────┘   └─────────────────┘ │  │
│  └──────────────┼─────────────────────────────────────────────────────────────────────┘  │
│                 │ Synchronous Non-Blocking Push (O(1))                                   │
│                 ▼                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ INGESTION & BUFFERING ENGINE (100ms Timed Flush Loop)                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  mutable buffers: [latestOrderBookMsg, tradesBuffer[], tickersBuffer[]]      │  │  │
│  │  └──────────────────────────────────────┬───────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┼──────────────────────────────────────────┘  │
│                                            │ Batch Flush (10 FPS / 100ms)                │
│                                            ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ STATE MANAGEMENT LAYER (Zustand Stores)                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │  │
│  │  │ useMarketStore   │  │ useTickerStore   │  │ useOrderBookStore│  │useTradesStore│ │  │
│  │  │ (Focused Symbol) │  │ (All 6 Symbols)  │  │ (Grouped Bids/Ask│  │(Agg Trades &│ │  │
│  │  │ (Connection State│  │                  │  │  Spread Metrics) │  │ 1m Volume)  │ │  │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘ │  │
│  └───────────┼─────────────────────┼─────────────────────┼───────────────────┼────────┘  │
│              │ Selective           │ Granular            │ Memoized          │ Index     │
│              │ Subscription        │ Selectors           │ Deep Bars         │ Zero-CLS  │
│              ▼                     ▼                     ▼                   ▼           │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ PRESENTATION & UI LAYER (React 18 Component Tree)                                  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ │  │
│  │  │ GlobalHeader     │  │ TickerBar        │  │ OrderBookPanel   │  │ TradesPanel │ │  │
│  │  │ (Status Badge)   │  │ (Ticker Cards)   │  │ (OrderBookRows)  │  │ (TradeRows) │ │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └─────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance

See [`docs/03-PERFORMANCE-STRATEGY.md`](./docs/03-PERFORMANCE-STRATEGY.md) for an explanation of the buffering model, 100ms flush intervals, CLS elimination, and the main-thread vs. Web Worker tradeoff decision.

## Testing

See [`docs/05-TESTING.md`](./docs/05-TESTING.md) for the test structure, what is covered, and how to interpret the test suite.

## Tradeoffs

See [`docs/06-TRADEOFFS.md`](./docs/06-TRADEOFFS.md) for explicit design decisions including the CPU work placement tradeoff, CLS root cause analysis, and a scaling discussion for significantly more symbols.

## Development Workflow & Prompt Log

See [`docs/07-PROMPT-ENGINEERING.md`](./docs/07-PROMPT-ENGINEERING.md) for the complete prompt-by-prompt log of how this project was developed using AI co-piloting, including human engineering decisions, prompt history, and retrospectives.

---

## Project Structure

```text
delta-trading-dashboard/
├── src/
│   ├── __tests__/              # Parallel test mirror of /src
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── components/
│   │   ├── Layout/             # GlobalHeader, Dashboard, Footer
│   │   ├── OrderBook/          # OrderBookPanel, OrderBookRow, OrderBookMetrics
│   │   ├── TradesFeed/         # TradesPanel, TradesRow
│   │   ├── Tickers/            # TickerBar, TickerCard
│   │   ├── OrderEntry/         # OrderEntryPanel
│   │   └── Shared/             # ConnectionStatusIndicator, TableShimmer, PanelPlaceholder
│   ├── hooks/                  # useWebSocketConnection, useFlashEffect, useTradesDecay
│   ├── services/               # WebSocketManager (singleton)
│   ├── store/                  # Zustand stores (market, ticker, orderBook, trades)
│   ├── types/                  # market.ts TypeScript interfaces
│   └── utils/                  # Pure functions: format, parse, orderbook, trades
├── docs/                       # Architecture and strategy documentation
└── package.json
```

---

## Known Limitations

- The order book UI renders at a capped 10 FPS (100ms flush). This is intentional to prevent main-thread saturation. Visual data is never lost — only intermediate frames are dropped.
- The backend mock server does not support deltas; it sends full order book snapshots on every message.
- `pruneOldTrades` (60s rolling stats) relies on `useTradesDecay`, which polls via a `setInterval`. In a production system this would be replaced with a time-bucketed data structure.

---

## Tech Stack

| Category | Technology | Description |
|---|---|---|
| **Framework & Core** | React 18 | Declarative UI library with granular render isolation |
| **Language** | TypeScript | Type-safe domain models and strict state definitions |
| **Build Tool** | Vite | Next-generation frontend tooling and HMR dev server |
| **State Management** | Zustand | Lightweight state stores separated by domain concerns |
| **Styling** | Tailwind CSS v4 | Modern utility-first styling with zero-runtime overhead |
| **Virtualization** | TanStack Virtual | Efficient DOM virtualization for high-frequency feeds |
| **Testing** | Vitest | Fast unit testing suite covering domain math, stores, & buffers |
| **Linting & Code Quality** | ESLint 9 | Strict code quality & React hooks rule verification |
| **Real-Time Transport** | WebSockets | Native WebSocket protocol with resilient reconnection manager |

