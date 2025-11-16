import { filterMirroredTransactions, calculateIncome, getDateRange } from '~/composables/useActivityStats'
import type { FinancialTransaction } from '~/types'

export interface MonthlyIncome {
  month: string
  year: number
  income: number
  change: number
  transactions: FinancialTransaction[]
}

export interface IncomeBreakdown {
  salary: number
  salaryTxs: FinancialTransaction[]
  interestTotal: number
  interestCount: number
  other: number
  otherTxs: FinancialTransaction[]
}

export function useIncomeStats(data: Ref<any>) {
  const filteredTxs = computed(() => {
    const transactions = data.value?.transactions || []
    return filterMirroredTransactions(transactions)
  })

  const monthlyIncomes = computed(() => {
    const months: MonthlyIncome[] = []

    for (let i = 0; i < 6; i++) {
      const range = getDateRange('month', -i)
      const income = calculateIncome(filteredTxs.value, range)

      const monthTxs = filteredTxs.value.filter((tx) => {
        const date = new Date(tx.dateTime)
        return date >= range.start && date <= range.end && tx.amount > 0
      })

      const monthName = range.start.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })

      let change = 0
      if (i < 5) {
        const prevRange = getDateRange('month', -(i + 1))
        const prevIncome = calculateIncome(filteredTxs.value, prevRange)
        change = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0
      }

      months.push({
        month: monthName,
        year: range.start.getFullYear(),
        income,
        change,
        transactions: monthTxs,
      })
    }
    return months
  })

  function getBreakdown(transactions: FinancialTransaction[]): IncomeBreakdown {
    const breakdown: IncomeBreakdown = {
      salary: 0,
      salaryTxs: [],
      interestTotal: 0,
      interestCount: 0,
      other: 0,
      otherTxs: [],
    }

    for (const tx of transactions) {
      if (tx.source === 'bank-account' && tx.amount > 0) {
        const desc = tx.description.toLowerCase()
        if (desc.includes('payroll') || desc.includes('salary')) {
          breakdown.salary += tx.amount
          breakdown.salaryTxs.push(tx)
        } else {
          if (tx.category === 'reimbursement') {
            continue // Skip reimbursements
          }
          
          breakdown.other += tx.amount
          breakdown.otherTxs.push(tx)
        }
      } else if (tx.type === 'INTEREST/CASHBACK') {
        breakdown.interestTotal += tx.amount
        breakdown.interestCount++
      }
    }

    return breakdown
  }

  return {
    monthlyIncomes,
    getBreakdown
  }
}
