const {IndexerGrpcSpotApi, IndexerRestSpotChronosApi,} = require('@injectivelabs/sdk-ts')
const {getNetworkEndpoints, Network} = require('@injectivelabs/networks')

const network = process.env.NETWORK === 'mainnet' ? Network.Mainnet : Network.Testnet
const endpoints = getNetworkEndpoints(network)

const spotApi = new IndexerGrpcSpotApi(endpoints.indexer)
const chronosApi = new IndexerRestSpotChronosApi(
  `${endpoints.chronos}/api/chronos/v1/spot`
)

async function fetchAllMarkets(){
    try{
        const market = await spotApi.fetchMarkets();
        return market;
    } catch (error){
        throw new Error(`Failed to fetch markets: ${error.message}`)
    }
}

async function fetchMarketById(marketId) {
  try {
    const market = await spotApi.fetchMarket(marketId)
    return market
  } catch (error) {
    throw new Error(`Failed to fetch market ${marketId}: ${error.message}`)
  }
}

async function fetchOrderbook(marketId) {
  try {
    const orderbook = await spotApi.fetchOrderbookV2(marketId)
    return orderbook
  } catch (error) {
    throw new Error(`Failed to fetch orderbook for ${marketId}: ${error.message}`)
  }
}


async function fetchTrades(marketId, limit = 100) {
  try {
    const trades = await spotApi.fetchTrades({ marketId, limit })
    return trades
  } catch (error) {
    throw new Error(`Failed to fetch trades for ${marketId}: ${error.message}`)
  }
}

async function fetchMarketSummary(marketId) {
  try {
    const summary = await chronosApi.fetchMarketSummary(marketId)
    return summary
  } catch (error) {
    throw new Error(`Failed to fetch summary for ${marketId}: ${error.message}`)
  }
}

async function fetchAllMarketSummaries() {
  try {
    const summaries = await chronosApi.fetchMarketsSummary()
    return summaries
  } catch (error) {
    throw new Error(`Failed to fetch market summaries: ${error.message}`)
  }
}

module.exports = {
  fetchAllMarkets,
  fetchMarketById,
  fetchOrderbook,
  fetchTrades,
  fetchMarketSummary,
  fetchAllMarketSummaries,
}