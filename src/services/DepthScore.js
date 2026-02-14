function calculateDepthScore(buys, sells){
    if (!buys?.length || !sells?.length) return 0

    const bestBid = parseFloat(buys[0].price)
    const bestAsk = parseFloat(sells[0].price)
    const midPrice = (bestBid + bestAsk) / 2
    const rangeLow  = midPrice * 0.98  
    const rangeHigh = midPrice * 1.02  

    let totalLiquidity = 0

    buys.forEach(order => {
    if (parseFloat(order.price) >= rangeLow) {
        totalLiquidity += parseFloat(order.quantity) * parseFloat(order.price)
        }
    })

    sells.forEach(order => {
        if (parseFloat(order.price) <= rangeHigh) {
        totalLiquidity += parseFloat(order.quantity) * parseFloat(order.price)
        }
    })

    const score = Math.min(100, (totalLiquidity / 100000) * 100)
    return Math.round(score)

}

module.exports = {calculateDepthScore}

