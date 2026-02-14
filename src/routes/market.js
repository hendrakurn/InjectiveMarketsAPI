const express = require('express')
const router  = express.Router()

const {
  fetchAllMarkets,
  fetchAllMarketSummaries,
  fetchOrderbook,
  fetchTrades,
} = require('../controller/injective')

const {
  validateTopQuery,
  validateVolatilityQuery,
  validateMarketId,
} = require('../middleware/validator')


const {
  calculateHealthScore,
  calculateVolatility,
} = require('../controller/calculator')


router.get('/summary', async (req, res, next) => {
  try {
    const [markets, summaries] = await Promise.all([
      fetchAllMarkets(),
      fetchAllMarketSummaries(),
    ])
    const summaryMap = {}
    summaries.forEach(s => { summaryMap[s.marketId] = s })

    const formatted = markets.map(market => {
      const s = summaryMap[market.marketId] || {}
      return {
        market_id:        market.marketId,
        ticker:           market.ticker,
        base_denom:       market.baseDenom,
        quote_denom:      market.quoteDenom,
        status:           market.marketStatus,
        last_price:       s.price        || '0',
        volume_24h:       s.volume       || '0',
        price_change_24h: s.change       || '0',
        high_24h:         s.high         || '0',
        low_24h:          s.low          || '0',
      }
    })

    res.json({
      success: true,
      total_markets: formatted.length,
      timestamp: new Date().toISOString(),
      markets: formatted,
    })
  } catch (err) {
    next(err)
  }
})
router.get('/top', validateTopQuery, async (req, res, next) => {
  try {
    const by    = req.query.by    || 'volume'
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)

    const [markets, summaries] = await Promise.all([
      fetchAllMarkets(),
      fetchAllMarketSummaries(),
    ])

    const summaryMap = {}
    summaries.forEach(s => { summaryMap[s.marketId] = s })

    let combined = markets.map(market => {
      const s = summaryMap[market.marketId] || {}
      return {
        market_id:        market.marketId,
        ticker:           market.ticker,
        last_price:       s.price  || '0',
        volume_24h:       s.volume || '0',
        price_change_24h: s.change || '0',
        high_24h:         s.high   || '0',
        low_24h:          s.low    || '0',
      }
    })

    // ─── Sorting eksplisit per parameter ───────────────────
    if (by === 'price_change') {

      combined.sort((a, b) =>
        parseFloat(b.price_change_24h) - parseFloat(a.price_change_24h)
      )

    } else if (by === 'health_score') {

      const prefiltered = [...combined]
        .sort((a, b) => parseFloat(b.volume_24h) - parseFloat(a.volume_24h))
        .slice(0, 20)

      const withHealth = await Promise.all(
        prefiltered.map(async (market) => {
          try {
            const [orderbook, tradesData] = await Promise.all([
              fetchOrderbook(market.market_id),
              fetchTrades(market.market_id, 100),
            ])
            const buys   = orderbook.buys    || []
            const sells  = orderbook.sells   || []
            const trades = tradesData.trades || []
            const health = calculateHealthScore(buys, sells, trades)

            return {
              ...market,
              health_score: health.health_score,
              grade:        health.grade,
              status:       health.status,
            }
          } catch {
            return {
              ...market,
              health_score: 0,
              grade:        'N/A',
              status:       'unavailable',
            }
          }
        })
      )

      combined = withHealth.sort((a, b) => b.health_score - a.health_score)

    } else {
      combined.sort((a, b) =>
        parseFloat(b.volume_24h) - parseFloat(a.volume_24h)
      )
    }

    const topMarkets = combined.slice(0, limit).map((market, index) => ({
      rank: index + 1,
      ...market,
    }))

    res.json({
      success:   true,
      ranked_by: by,
      limit,
      timestamp: new Date().toISOString(),
      markets:   topMarkets,
    })

  } catch (err) {
    next(err)
  }
})


// GET /markets/compare?ids=marketId1,marketId2
router.get('/compare', async (req, res, next) => {
  try {
    const { ids } = req.query

    if (!ids) {
      return res.status(400).json({
        success: false,
        error:   'MISSING_PARAMETER',
        message: "Parameter 'ids' is required. Provide comma-separated market IDs.",
        example: '/markets/compare?ids=0xabc...,0xdef...'
      })
    }

    const marketIds = ids.split(',').map(id => id.trim()).filter(Boolean)

    if (marketIds.length < 2 || marketIds.length > 5) {
      return res.status(400).json({
        success: false,
        error:   'INVALID_PARAMETER',
        message: 'Provide between 2 and 5 market IDs to compare'
      })
    }

    // Fetch semua market paralel
    const results = await Promise.all(
      marketIds.map(async (marketId) => {
        const [orderbook, tradesData] = await Promise.all([
          fetchOrderbook(marketId),
          fetchTrades(marketId, 200),
        ])

        const buys   = orderbook.buys    || []
        const sells  = orderbook.sells   || []
        const trades = tradesData.trades || []

        const health     = calculateHealthScore(buys, sells, trades)
        const volatility = calculateVolatility(trades, 1)

        return {
          market_id:    marketId,
          health_score: health.health_score,
          grade:        health.grade,
          status:       health.status,
          volatility_1h: volatility.volatility_pct,
          best_bid:     buys[0]?.price  || '0',
          best_ask:     sells[0]?.price || '0',
        }
      })
    )

    // Sort by health score untuk memudahkan keputusan
    results.sort((a, b) => b.health_score - a.health_score)

    res.json({
      success:    true,
      timestamp:  new Date().toISOString(),
      best_market: results[0].market_id,
      comparison: results,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/health', async (req, res, next) => {
  try {
    const marketId = req.params.id

    // Ambil orderbook dan trades secara paralel
    const [orderbook, tradesData] = await Promise.all([
      fetchOrderbook(marketId),
      fetchTrades(marketId, 200),
    ])

    const buys   = orderbook.buys   || []
    const sells  = orderbook.sells  || []
    const trades = tradesData.trades || []

    const result = calculateHealthScore(buys, sells, trades)

    res.json({
      success:   true,
      market_id: marketId,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/volatility',  validateMarketId, validateVolatilityQuery,async (req, res, next) => {
  try {
    const marketId    = req.params.id
    const windowParam = req.query.window || '1h'

    const windowHours = parseInt(windowParam.replace('h', '')) || 1

    if (windowHours > 24) {
      return res.status(400).json({
        success: false,
        message: 'Maximum window is 24h'
      })
    }

    const tradeLimit  = Math.min(windowHours * 100, 500)
    const tradesData  = await fetchTrades(marketId, tradeLimit)
    const trades      = tradesData.trades || []

    const result = calculateVolatility(trades, windowHours)

    res.json({
      success:   true,
      market_id: marketId,
      window:    windowParam,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/summary', validateMarketId, async (req, res, next) => {
  try {
    const marketId = req.params.id

    const [orderbook, tradesData, allSummaries] = await Promise.all([
      fetchOrderbook(marketId),
      fetchTrades(marketId, 200),
      fetchAllMarketSummaries(),
    ])

    const buys   = orderbook.buys    || []
    const sells  = orderbook.sells   || []
    const trades = tradesData.trades || []

    const marketSummary = allSummaries.find(s => s.marketId === marketId) || {}
    const health        = calculateHealthScore(buys, sells, trades)
    const volatility1h  = calculateVolatility(trades, 1)
    const volatility24h = calculateVolatility(trades, 24)

    res.json({
      success:    true,
      market_id:  marketId,
      timestamp:  new Date().toISOString(),
      price: {
        last:      marketSummary.price  || '0',
        high_24h:  marketSummary.high   || '0',
        low_24h:   marketSummary.low    || '0',
        change_24h: marketSummary.change || '0',
      },
      volume: {
        volume_24h: marketSummary.volume || '0',
      },
      health: {
        score:          health.health_score,
        grade:          health.grade,
        status:         health.status,
        recommendation: health.recommendation,
      },
      volatility: {
        '1h':  volatility1h,
        '24h': volatility24h,
      },
      orderbook_snapshot: {
        best_bid:   buys[0]?.price  || '0',
        best_ask:   sells[0]?.price || '0',
        bid_levels: buys.length,
        ask_levels: sells.length,
      }
    })
  } catch (err) {
    next(err)
  }
})


module.exports = router