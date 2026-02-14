function calculateSpreadScore(buys, sells){
    if(!buys?.length || !sells?.length) return 0;

    const bestBid = parseFloat(buys[0].price) //highest sell
    const bestAsk = parseFloat(sells[0].price) //lowes buy

    if(bestBid <=0 || bestAsk <=0) return 0;

    const midPrice = (bestBid + bestAsk) /2
    const spreadPct = ((bestAsk - bestBid)/midPrice) *100

    const k = 2.5
    const score = 100 * Math.exp(-k * spreadPct)

    return Math.round(Math.min(100, score))
}

module.exports = {calculateSpreadScore}

