import type { CombinedFinancialData, FinancialTransaction } from '~/types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

// produce a smooth realistic series with dips/spikes
function generateDemoTransactions(): FinancialTransaction[] {
  const txs: FinancialTransaction[] = []
  const totalDays = 120 // ~4 months
  let runningBalance = 1000

  for (let i = totalDays; i >= 0; i--) {
    const day = daysAgo(i)

    // simulate regular salary deposits (every 14 days)
    if (i % 14 === 0) {
      const deposit = randomBetween(1800, 2400)
      runningBalance += deposit
      txs.push({
        type: 'DEPOSIT',
        amount: deposit,
        reference: `PAY_${i}`,
        dateTime: day,
        source: 'bank-account',
      })
    }

    // small daily card spending (0–2 per day)
    const spendCount = Math.floor(Math.random() * 3)
    for (let j = 0; j < spendCount; j++) {
      const spend = randomBetween(10, 120)
      runningBalance -= spend
      txs.push({
        type: 'WITHDRAW',
        amount: -spend,
        reference: `CARD_SPEND_${i}_${j}`,
        dateTime: day,
        source: 'credit-card',
      })
    }

    // occasional trading gains/losses
    if (Math.random() < 0.15) {
      const profit = randomBetween(-80, 150)
      runningBalance += profit
      txs.push({
        type: profit >= 0 ? 'DEPOSIT' : 'WITHDRAW',
        amount: profit,
        reference: `TRADE_${i}`,
        dateTime: day,
        source: 'trading212',
      })
    }

    // small weekly cashback
    if (i % 7 === 0 && Math.random() < 0.4) {
      const cashback = randomBetween(1, 10)
      runningBalance += cashback
      txs.push({
        type: 'DEPOSIT',
        amount: cashback,
        reference: `CASHBACK_${i}`,
        dateTime: day,
        source: 'credit-card',
      })
    }
  }

  // normalise amounts
  return txs
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .map((t) => ({
      ...t,
      amount: Number(t.amount.toFixed(2)),
    }))
}

export default defineEventHandler(async () => {
  const transactions = generateDemoTransactions()

  // derive total balance by summing
  const totalBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0) + 3100 // starting offset

  const combinedData: CombinedFinancialData = {
    transactions,
    totalBalance,
  }

  await new Promise((r) => setTimeout(r, 400))
  return combinedData
})
