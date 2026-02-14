// src/app.js

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const marketsRouter = require('./routes/market')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    name: 'Injective Market Intelligence API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /markets/summary',
      'GET /markets/top',
      'GET /markets/:id/health',
      'GET /markets/:id/volatility',
      'GET /markets/:id/summary',
      'GET /markets/compare?ids=marketId1,marketId2'
    ]
  })
})

app.use('/markets', marketsRouter)

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({
    error: true,
    message: err.message || 'Internal server error'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})