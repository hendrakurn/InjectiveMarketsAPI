function calculateActivityScore(trades) {
  if (!trades?.length) return 0

  const oneHourAgo = Date.now() - 60 * 60 * 1000

  const recentTrades = trades.filter(trade => {
    const tradeTime = parseInt(trade.executedAt)
    return tradeTime >= oneHourAgo
  })

  const tradesPerHour = recentTrades.length

  const x = Math.log1p(tradesPerHour)

  const k = 1.2
  const score = 100 * (1 - Math.exp(-k * x))

  return Math.round(Math.min(100, score))
}

module.exports = {calculateActivityScore}