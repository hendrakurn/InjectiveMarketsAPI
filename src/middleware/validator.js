// src/middleware/validator.js

const VALID_WINDOWS    = ['1h', '4h', '12h', '24h']
const VALID_SORT_KEYS  = ['volume', 'price_change', 'health_score']
const MAX_LIMIT        = 50

function validateTopQuery(req, res, next) {
  const { by = 'volume', limit = '10' } = req.query

  if (!VALID_SORT_KEYS.includes(by)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PARAMETER',
      message: `Parameter 'by' must be one of: ${VALID_SORT_KEYS.join(', ')}`,
      received: by
    })
  }

  const parsedLimit = parseInt(limit)
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PARAMETER',
      message: `Parameter 'limit' must be a number between 1 and ${MAX_LIMIT}`,
      received: limit
    })
  }

  next()
}

function validateVolatilityQuery(req, res, next) {
  const { window = '1h' } = req.query

  if (!VALID_WINDOWS.includes(window)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PARAMETER',
      message: `Parameter 'window' must be one of: ${VALID_WINDOWS.join(', ')}`,
      received: window
    })
  }

  next()
}

function validateMarketId(req, res, next) {
  const { id } = req.params

  // Injective market ID selalu format hex 0x + 64 karakter
  const marketIdRegex = /^0x[a-fA-F0-9]{64}$/

  if (!marketIdRegex.test(id)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_MARKET_ID',
      message: 'Market ID must be a valid Injective market ID (0x + 64 hex characters)',
      received: id,
      example: '0xabc123...64chars'
    })
  }

  next()
}

module.exports = {
  validateTopQuery,
  validateVolatilityQuery,
  validateMarketId,
}