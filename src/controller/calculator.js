const { calculateActivityScore } = require('../services/ActivityScore')
const { calculateDepthScore } = require('../services/DepthScore')
const { calculateSpreadScore } = require('../services/SpreadScore')
const { calculateStabilityScore } = require('../services/StabilityScore')


function calculateHealthScore(buys, sells, trades) {
  const spreadScore   = calculateSpreadScore(buys, sells)
  const depthScore    = calculateDepthScore(buys, sells)
  const activityScore = calculateActivityScore(trades)
  const stabilityScore = calculateStabilityScore(trades)

  // Weighted average
  const healthScore = Math.round(
    spreadScore   * 0.30 +
    depthScore    * 0.30 +
    activityScore * 0.25 +
    stabilityScore * 0.15
  )

  // Tentukan grade
  let grade, status, recommendation
  if (healthScore >= 90) {
    grade = 'A'; status = 'Excellent'
    recommendation = 'Highly liquid. Suitable for all trading strategies including high-frequency bots.'
  } else if (healthScore >= 80) {
    grade = 'A-'; status = 'Healthy'
    recommendation = 'Good liquidity. Suitable for most trading strategies.'
  } else if (healthScore >= 70) {
    grade = 'B+'; status = 'Good'
    recommendation = 'Moderate liquidity. Suitable for regular trading with reasonable order sizes.'
  } else if (healthScore >= 60) {
    grade = 'B'; status = 'Moderate'
    recommendation = 'Below average liquidity. Use caution with large orders.'
  } else if (healthScore >= 50) {
    grade = 'C'; status = 'Poor'
    recommendation = 'Low liquidity. High slippage risk. Not recommended for bots.'
  } else {
    grade = 'D'; status = 'Avoid'
    recommendation = 'Very low liquidity. Avoid unless necessary.'
  }

  return {
    health_score: healthScore,
    grade,
    status,
    recommendation,
    components: {
      spread:    { score: spreadScore,    weight: '30%' },
      depth:     { score: depthScore,     weight: '30%' },
      activity:  { score: activityScore,  weight: '25%' },
      stability: { score: stabilityScore, weight: '15%' },
    }
  }
}


function calculateVolatility(trades, windowHours = 1) {
  if (!trades?.length || trades.length < 2) {
    return { volatility_pct: 0, interpretation: 'insufficient_data' }
  }

  const windowMs = windowHours * 60 * 60 * 1000
  const cutoff   = Date.now() - windowMs

  // Filter trade dalam window waktu
  const filtered = trades
    .filter(t => parseInt(t.executedAt) >= cutoff)
    .map(t => parseFloat(t.price))
    .filter(p => p > 0)

  if (filtered.length < 2) {
    return { volatility_pct: 0, interpretation: 'insufficient_data' }
  }

  // Hitung return per trade
  const returns = []
  for (let i = 1; i < filtered.length; i++) {
    returns.push((filtered[i] - filtered[i - 1]) / filtered[i - 1])
  }

  // Standard deviation of returns
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)

  const volatilityPct = stdDev * 100

  // Annualized (asumsi 365 hari, 24 jam)
  const periodsPerYear = (365 * 24) / windowHours
  const annualized = stdDev * Math.sqrt(periodsPerYear) * 100

  // Interpretasi
  let interpretation
  if (volatilityPct < 0.5)       interpretation = 'very_low'
  else if (volatilityPct < 1.5)  interpretation = 'low'
  else if (volatilityPct < 3.0)  interpretation = 'moderate'
  else if (volatilityPct < 5.0)  interpretation = 'high'
  else                           interpretation = 'very_high'

  return {
    volatility_pct: parseFloat(volatilityPct.toFixed(4)),
    annualized_volatility_pct: parseFloat(annualized.toFixed(2)),
    price_high: Math.max(...filtered).toString(),
    price_low:  Math.min(...filtered).toString(),
    sample_size: filtered.length,
    interpretation
  }
}


module.exports = {
  calculateHealthScore,
  calculateVolatility,
}