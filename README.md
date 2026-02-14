# Injective Developer API — Activity & Metrics Service

This repository contains a lightweight developer-focused API that exposes derived, developer-friendly data from Injective's on-chain trading and market infrastructure. It's designed as a reusable backend service other developers can query to build tools, dashboards, or automated workflows.

## What this API does
- Aggregates and processes Injective trading data to provide simple, actionable endpoints for developers.
- Exposes market summaries, orderbook depth snapshots, derived metrics (liquidity, volatility, stability), and lightweight activity feeds.
- Intended for local or test deployments (no real funds required).

## Main endpoints and parameters
Note: paths below are example endpoints implemented under `src/` and are intended to be RESTful.

- GET /api/v1/markets
	- Query params: `symbol` (optional) — filter by market symbol (e.g. `INJ/USDT`), `limit` (optional)
	- Returns: list of available markets with basic metadata and best bid/ask.

- GET /api/v1/markets/:symbol/summary
	- Path param: `:symbol` — market symbol
	- Query params: `range` (optional) — time range for summary (e.g. `1h`, `24h`, `7d`)
	- Returns: OHLC summary, 24h volume, price change, and aggregated liquidity metrics.

- GET /api/v1/markets/:symbol/orderbook
	- Path param: `:symbol`
	- Query params: `depth` (optional, default 20) — number of levels per side
	- Returns: top N bids and asks with aggregated amounts and depth snapshots.

- GET /api/v1/markets/:symbol/metrics
	- Path param: `:symbol`
	- Query params: `window` (optional, e.g. `5m`, `1h`) — window used for derived metrics
	- Returns: derived metrics such as volatility, liquidity score, spread score, and stability score.

- GET /api/v1/activity/recent
	- Query params: `symbol` (optional), `limit` (optional)
	- Returns: recent trade events and order activity normalized for developer consumption.

## Injective data sources used
- On-chain RPC / gRPC endpoints (for latest chain state and transactions)
- Indexer or historical data provider (to fetch historical trades and orderbook snapshots)
- Injective REST APIs or public websocket feeds (for real-time market data)

## Implementation notes
- The service is structured to separate concerns: routing in `routes/`, controllers in `src/controller/`, and metric logic in `services/`.
- Endpoints return JSON and are designed to be idempotent and cache-friendly. The service can be extended with caching layers (Redis) or additional indexers.

How to run the API locally
1. Clone the repository and install dependencies.

```bash
git clone https://github.com/hendrakurn/InjectiveMarketsAPI.git
cd InjectiveMarketAPI
npm install
```

2. Configure environment variables (create a `.env` or export in shell):

- `INJECTIVE_RPC` — Injective RPC/gRPC endpoint (optional for local testing)
- `INDEXER_URL` — HTTP endpoint for indexer/historical data (optional)
- `PORT` — port to run the API (default 3000)

Example `.env` contents:

```bash
INJECTIVE_RPC=https://public.injective.network
INDEXER_URL=https://your.indexer.service
PORT=3000
```

3. Start the server:

```bash

npm run dev

```

4. Try an endpoint (example):
try endpoint at local host or

```bash
curl "http://localhost:3000"
curl "http://localhost:3000/markets/summary"
```
