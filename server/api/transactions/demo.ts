import type { CombinedFinancialData, FinancialTransaction } from '~/types'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default defineEventHandler(async () => {
  const now = Date.now()
  const day = 1000 * 60 * 60 * 24
  const transactions: FinancialTransaction[] = []
  
  const incomeTypes = [
    'Salary - Tech Corp Ltd',
    'Freelance Payment - Client ABC',
    'Dividend Payment - VWRL',
    'Interest - Savings Account',
    'Tax Refund - HMRC',
    'Cashback Rewards',
    'Investment Sale - Profit'
  ]
  
  const expenseTypes = [
    'Rent Payment',
    'Grocery Shopping - Tesco',
    'Grocery Shopping - Sainsburys',
    'Fuel - Shell Station',
    'Fuel - BP Station', 
    'Coffee - Starbucks',
    'Lunch - Pret A Manger',
    'Netflix Subscription',
    'Spotify Premium',
    'Amazon Prime',
    'Phone Bill - EE',
    'Internet - BT',
    'Utility Bills - British Gas',
    'Council Tax',
    'Insurance Premium',
    'Gym Membership',
    'Public Transport',
    'Uber Ride',
    'Restaurant - Pizza Express',
    'Cinema Tickets',
    'Clothing - H&M',
    'Books - Waterstones',
    'Pharmacy - Boots'
  ]
  
  const tradingTypes = [
    'Investment - Buy VWRL',
    'Investment - Buy TSLA', 
    'Investment - Buy AAPL',
    'Investment - Sell MSFT',
    'Dividend - Apple Inc',
    'Dividend - Microsoft',
    'Trading Fee',
    'Currency Exchange'
  ]

  let runningBalance = 42000
  
  for (let daysAgo = 120; daysAgo >= 0; daysAgo--) {
    const date = new Date(now - (daysAgo * day))
    const numTransactions = Math.floor(randomBetween(0, 4))
    
    for (let i = 0; i < numTransactions; i++) {
      const isIncome = Math.random() > 0.7
      const source = randomChoice(['bank-account', 'credit-card', 'trading212'])
      
      let type: 'DEPOSIT' | 'WITHDRAW'
      let amount: number
      let reference: string
      
      if (isIncome || source === 'credit-card' && Math.random() > 0.9) {
        type = 'DEPOSIT'
        if (source === 'bank-account') {
          amount = Math.floor(randomBetween(500, 3000))
          reference = randomChoice(incomeTypes)
        } else if (source === 'trading212') {
          amount = Math.floor(randomBetween(10, 200) * 100) / 100
          reference = randomChoice(tradingTypes.filter(t => t.includes('Dividend') || t.includes('Sell')))
        } else {
          amount = Math.floor(randomBetween(5, 50) * 100) / 100
          reference = randomChoice(incomeTypes.filter(t => t.includes('Cashback')))
        }
      } else {
        type = 'WITHDRAW'
        if (source === 'bank-account') {
          amount = -Math.floor(randomBetween(20, 800))
          reference = randomChoice(expenseTypes.filter(t => 
            t.includes('Rent') || t.includes('Utility') || t.includes('Council') || 
            t.includes('Insurance') || t.includes('Phone') || t.includes('Internet')
          ))
        } else if (source === 'trading212') {
          amount = -Math.floor(randomBetween(100, 1000))
          reference = randomChoice(tradingTypes.filter(t => t.includes('Buy') || t.includes('Fee')))
        } else {
          amount = -Math.floor(randomBetween(5, 200) * 100) / 100
          reference = randomChoice(expenseTypes.filter(t => 
            !t.includes('Rent') && !t.includes('Utility') && !t.includes('Council') &&
            !t.includes('Insurance') && !t.includes('Phone') && !t.includes('Internet')
          ))
        }
      }
      
      runningBalance += amount
      
      const randomHour = Math.floor(randomBetween(8, 22))
      const randomMinute = Math.floor(randomBetween(0, 59))
      date.setHours(randomHour, randomMinute, 0, 0)
      
      transactions.push({
        type,
        amount,
        reference: `${reference}_${generateUUID()}`,
        dateTime: date.toISOString(),
        source,
        category: 'Uncategorized', // Will be categorized by the categorization system
        description: reference // Use reference as description
      })
    }
  }
  
  const totalBalance = 25432.50 + 15678.90 - 1234.56
  
  const combinedData: CombinedFinancialData = {
    transactions: transactions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    totalBalance
  }

  await new Promise(resolve => setTimeout(resolve, 200))
  return combinedData
})
