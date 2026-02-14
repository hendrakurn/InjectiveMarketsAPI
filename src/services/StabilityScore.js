function getPercentile(arr, p) {
  if (!arr.length) return 0

  const sorted = [...arr].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * p
  const base = Math.floor(pos)
  const rest = pos - base

  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

function calculateStabilityScore(trades, volumeHistoryLog = []) {
  if (!trades || trades.length < 10) return 30

  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const bucketSize = 10 * 60 * 1000
  const buckets = {}

  for (const trade of trades) {
    const t = parseInt(trade.executedAt)
    if (t >= oneHourAgo) {
      const bucket = Math.floor(t / bucketSize)
      if (!buckets[bucket]) buckets[bucket] = 0

      const volume = parseFloat(trade.quantity) * parseFloat(trade.price)
      buckets[bucket] += Math.log1p(volume)
    }
  }

  const volumes = Object.values(buckets)

  if (!volumes.length) return 10

  const totalVolumeLog = volumes.reduce((a, b) => a + b, 0)

  if (volumeHistoryLog.length > 20) {
    const threshold = getPercentile(volumeHistoryLog, 0.1)

    if (totalVolumeLog < threshold) {
      return 10
    }
  }

  if (volumes.length < 2) {
    return 40
  }

  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length
  const variance =
    volumes.reduce((s, v) => s + (v - mean) ** 2, 0) / volumes.length

  const std = Math.sqrt(variance)

  const cv = mean > 0 ? std / mean : 1

  const k = 1.5
  const score = 100 * Math.exp(-k * cv)

  return Math.round(Math.min(100, score))
}

module.exports = { calculateStabilityScore }
