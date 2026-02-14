
require('dotenv').config()

const {
  fetchAllMarkets,
  fetchMarketSummary,
  fetchOrderbook,
} = require('./src/controller/injective')

async function test() {
  console.log('Test 1: Fetch all markets...')
  const markets = await fetchAllMarkets()
  console.log(`Got ${markets.length} markets`)
  console.log('Sample market:', markets[0]?.ticker, '\n')

  const firstMarketId = markets[0]?.marketId
  console.log(`Test 2: Fetch summary for ${markets[0]?.ticker}...`)
  const summary = await fetchMarketSummary(firstMarketId)
  console.log('Summary:', summary, '\n')

  console.log(`Test 3: Fetch orderbook for ${markets[0]?.ticker}...`)
  const orderbook = await fetchOrderbook(firstMarketId)
  console.log(`Orderbook — Buys: ${orderbook.buys?.length}, Sells: ${orderbook.sells?.length}`)
}

test().catch(console.error)