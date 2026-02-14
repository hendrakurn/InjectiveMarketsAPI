# MarketLens

> Market Intelligence API for the Injective Protocol ecosystem

MarketLens transforms raw Injective blockchain data into clean, computed, and developer-ready insights. Instead of querying multiple fragmented Injective endpoints and writing complex aggregation logic from scratch, developers get actionable market metrics in a single request.

---

## Why MarketLens?

Every developer building on Injective rewrites the same data aggregation logic from scratch. MarketLens eliminates that — one API, clean endpoints, computed metrics ready to use.
Building on Injective means dealing with multiple data sources Chain gRPC, Indexer API, and Chronos API each with different formats and levels of abstraction. Getting a simple answer like *"is this market healthy enough for my trading bot?"* requires hundreds of lines of boilerplate.
Raw Injective data tells you what happened. MarketLens tells you what it means market health, volatility, and liquidity scores in a single request. Stop parsing orderbooks, stop calculating spreads, marketLens gives you the answers, not the raw data.

` "Injective data is powerful but complex. MarketLens makes it simple." `

MarketLens abstracts all of that into clean REST endpoints with computed metrics:

- **Health Score** — single 0–100 score representing market quality
- **Volatility** — calculated using log returns (industry standard)
- **Market Rankings** — sort markets by volume, price change, or health
- **Market Comparison** — side-by-side analysis across multiple markets

---

## Endpoints

Base URL (local): `http://localhost:3000`

---

### `GET /markets/summary`
Returns all active spot markets with price and volume data.

**Example request:**
```bash
curl http://localhost:3000/markets/summary
```

**Example response:**
```json
{
  "success": true,
  "total_markets": 47,
  "timestamp": "2026-02-14T10:00:00.000Z",
  "markets": [
    {
      "market_id": "0xa508cb...",
      "ticker": "INJ/USDT",
      "base_denom": "inj",
      "quote_denom": "peggy0xdAC...",
      "status": "active",
      "last_price": "22.45",
      "volume_24h": "1250000",
      "price_change_24h": "3.2",
      "high_24h": "23.10",
      "low_24h": "21.80"
    }
  ]
}
```

---

### `GET /markets/top`
Returns ranked markets by a chosen metric.

| Parameter | Type   | Default | Options                              |
|-----------|--------|---------|--------------------------------------|
| `by`      | string | volume  | `volume`, `price_change`, `health_score` |
| `limit`   | number | 10      | 1 – 50                               |

**Example request:**
```bash
curl "http://localhost:3000/markets/top?by=volume&limit=5"
curl "http://localhost:3000/markets/top?by=health_score&limit=10"
```

**Example response:**
```json
{
  "success": true,
  "ranked_by": "volume",
  "limit": 5,
  "timestamp": "2026-02-14T10:00:00.000Z",
  "markets": [
    {
      "rank": 1,
      "market_id": "0xa508cb...",
      "ticker": "BTC/USDT",
      "volume_24h": "45000000",
      "health_score": 91,
      "grade": "A"
    }
  ]
}
```

---

### `GET /markets/compare`
Side-by-side comparison of 2–5 markets, ranked by health score.

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `ids`     | string | ✅ Yes   | Comma-separated market IDs (2–5)   |

**Example request:**
```bash
curl "http://localhost:3000/markets/compare?ids=0xMarketId1,0xMarketId2,0xMarketId3"
```

**Example response:**
```json
{
  "success": true,
  "timestamp": "2026-02-14T10:00:00.000Z",
  "best_market": "0xMarketId1",
  "comparison": [
    {
      "market_id": "0xMarketId1",
      "health_score": 82,
      "grade": "A-",
      "status": "Healthy",
      "volatility_1h": 1.24,
      "best_bid": "22.44",
      "best_ask": "22.46"
    }
  ]
}
```

---

### `GET /markets/:id/health`
Returns a computed Health Score for a specific market.

**Health Score components:**

| Component   | Weight | What it measures                        |
|-------------|--------|-----------------------------------------|
| Spread      | 30%    | Bid-ask spread relative to mid price    |
| Depth       | 30%    | Total liquidity within 2% of mid price  |
| Activity    | 25%    | Trade frequency in the last hour        |
| Stability   | 15%    | Volume consistency (penalizes spikes)   |

**Grade scale:**

| Grade | Score  | Status    |
|-------|--------|-----------|
| A     | 90–100 | Excellent |
| A-    | 80–89  | Healthy   |
| B+    | 70–79  | Good      |
| B     | 60–69  | Moderate  |
| C     | 50–59  | Poor      |
| D     | 0–49   | Avoid     |

**Example request:**
```bash
curl http://localhost:3000/markets/0xa508cb32923323679f29a032c70342c147c17d0145625922b0ef22e955c844c0/health
```

**Example response:**
```json
{
  "success": true,
  "market_id": "0xa508cb...",
  "timestamp": "2026-02-14T10:00:00.000Z",
  "health_score": 80,
  "grade": "A-",
  "status": "Healthy",
  "recommendation": "Good liquidity. Suitable for most trading strategies.",
  "components": {
    "spread":    { "score": 90, "weight": "30%" },
    "depth":     { "score": 75, "weight": "30%" },
    "activity":  { "score": 80, "weight": "25%" },
    "stability": { "score": 68, "weight": "15%" }
  }
}
```

---

### `GET /markets/:id/volatility`
Returns computed price volatility using the log returns method.

| Parameter | Options              | Default |
|-----------|----------------------|---------|
| `window`  | `1h`, `4h`, `12h`, `24h` | `1h` |

**Example request:**
```bash
curl "http://localhost:3000/markets/0xa508cb.../volatility?window=1h"
curl "http://localhost:3000/markets/0xa508cb.../volatility?window=24h"
```

**Example response:**
```json
{
  "success": true,
  "market_id": "0xa508cb...",
  "window": "1h",
  "timestamp": "2026-02-14T10:00:00.000Z",
  "volatility_pct": 1.24,
  "annualized_volatility_pct": 108.72,
  "price_high": "22.90",
  "price_low": "22.10",
  "sample_size": 87,
  "method": "log_returns",
  "interpretation": "low"
}
```

**Interpretation values:** `very_low`, `low`, `moderate`, `high`, `very_high`

---

### `GET /markets/:id/summary`
Full market profile combining price, health, volatility, and orderbook in one request.

**Example request:**
```bash
curl http://localhost:3000/markets/0xa508cb.../summary
```

**Example response:**
```json
{
  "success": true,
  "market_id": "0xa508cb...",
  "timestamp": "2026-02-14T10:00:00.000Z",
  "price": {
    "last": "22.45",
    "high_24h": "23.10",
    "low_24h": "21.80",
    "change_24h": "3.2"
  },
  "volume": {
    "volume_24h": "1250000"
  },
  "health": {
    "score": 80,
    "grade": "A-",
    "status": "Healthy",
    "recommendation": "Good liquidity. Suitable for most trading strategies."
  },
  "volatility": {
    "1h":  { "volatility_pct": 1.24, "interpretation": "low" },
    "24h": { "volatility_pct": 2.87, "interpretation": "moderate" }
  },
  "orderbook_snapshot": {
    "best_bid": "22.44",
    "best_ask": "22.46",
    "bid_levels": 20,
    "ask_levels": 20
  }
}
```

---

## How to Run Locally

**Requirements:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/hendrakurn/InjectiveMarketAPI.git
cd InjectiveMarketAPI

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NETWORK=mainnet
```

```bash
# 4. Start the server
npm run dev

# Server runs at http://localhost:3000
```

```bash
# 5. Verify it's working
curl http://localhost:3000
```

---

## Project Structure

```
InjectiveMarketAPI/
├── node_modules/
├── src/
│   ├── controller/
│   │   ├── calculator.js        # Health score & volatility logic
│   │   └── injective.js         # Injective API data fetching
│   │
│   ├── middleware/
│   │   └── validator.js         # Input validation
│   │
│   ├── routes/
│   │   └── markets.js           # All /markets/... endpoints
│   │
│   ├── services/
│   │   ├── ActivityScore.js     # Activity scoring logic
│   │   ├── DepthScore.js        # Market depth scoring logic
│   │   ├── SpreadScore.js       # Spread scoring logic
│   │   └── StabilityScore.js    # Stability scoring logic
│   │
│   └── app.js                   # Express entry point
│
├── .env                         # Environment variables
├── .env.example                 # Example environment config
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── test-connection.js           # API connection testing
```

---

## Data Sources

| Source                      | Used For                                    |
|-----------------------------|---------------------------------------------|
| Injective Indexer gRPC      | Market list, orderbook, trade history       |
| Injective Chronos REST API  | Price history, 24h volume, price change     |

All data is fetched in real-time from Injective mainnet via the official `@injectivelabs/sdk-ts` SDK.

---

## Example Use Cases

**Trading bot — verify market before executing:**
```js
const res = await fetch('/markets/0xMarketId/health')
const { health_score } = await res.json()

if (health_score >= 70) {
  bot.execute()
} else {
  bot.skip('market too illiquid')
}
```

**Dashboard — display top markets:**
```js
const res = await fetch('/markets/top?by=volume&limit=10')
const { markets } = await res.json()
renderTable(markets)
```

**Risk management — compare multiple markets:**
```js
const res = await fetch('/markets/compare?ids=id1,id2,id3')
const { best_market, comparison } = await res.json()
highlightSafest(best_market)
```

**Protocol lending — set collateral ratio based on market health:**
```js
const res = await fetch('/markets/0xMarketId/health')
const { health_score, components } = await res.json()

// Tighten collateral requirement when market is unhealthy
const collateralRatio = health_score >= 80 ? 1.5 : 2.0
protocol.setCollateralRatio(collateralRatio)
```

**Volatility-aware slippage — adjust tolerance dynamically:**
```js
const res = await fetch('/markets/0xMarketId/volatility?window=1h')
const { interpretation } = await res.json()

const slippage = {
  very_low: 0.1, low: 0.3, moderate: 0.5,
  high: 1.0, very_high: 2.0
}
dex.setSlippageTolerance(slippage[interpretation])
```

**Market discovery — find the best market to trade a token:**
```js
// User wants to trade INJ — find which INJ market is healthiest
const res = await fetch('/markets/top?by=health_score&limit=5')
const { markets } = await res.json()
const bestMarket = markets.find(m => m.ticker.includes('INJ'))
router.sendTo(bestMarket.market_id)
```

**Alert system — notify when market degrades:**
```js
setInterval(async () => {
  const res = await fetch('/markets/0xMarketId/health')
  const { health_score, grade } = await res.json()

  if (health_score < 60) {
    alerts.send(`⚠️ Market degraded: score ${health_score} (${grade})`)
    bot.pause()
  }
}, 60000) // check every minute
```

---

## Dependencies

| Package                   | Purpose                        |
|---------------------------|--------------------------------|
| `express`                 | REST API framework             |
| `@injectivelabs/sdk-ts`   | Official Injective SDK         |
| `@injectivelabs/networks` | Network endpoint configuration |
| `node-cache`              | In-memory response caching     |
| `axios`                   | HTTP client                    |
| `dotenv`                  | Environment variable management|

---

