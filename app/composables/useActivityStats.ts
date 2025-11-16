
import { ref, computed, readonly } from 'vue'
import type { ComputedRef } from 'vue'
import type { FinancialTransaction, Stat } from '~/types'

const MIRROR_TOLERANCE = 1 
const MIRROR_WINDOW_MS = 3 * 86400000 

/**
 * Check if two transactions are mirrors of each other
 * This happens when money moves from bank account to Trading212 (or vice versa)
 * 
 * @param bankTx - Transaction from bank account
 * @param t212Tx - Transaction from Trading212
 */
function isMirrored(bankTx: FinancialTransaction, t212Tx: FinancialTransaction): boolean {
  return (
    bankTx.source === 'bank-account' &&
    bankTx.amount < 0 && 
    t212Tx.source === 'trading212' &&
    t212Tx.amount > 0 && 
    Math.abs(Math.abs(bankTx.amount) - Math.abs(t212Tx.amount)) < MIRROR_TOLERANCE &&
    Math.abs(new Date(bankTx.dateTime).getTime() - new Date(t212Tx.dateTime).getTime()) < MIRROR_WINDOW_MS
  )
}

/**
 * Remove mirrored transactions to avoid double-counting transfers
 * When money moves from bank to Trading212, we see it as both a withdrawal and deposit
 * This function removes the duplicates to show the true financial picture
 * 
 * @param transactions - Array of all transactions
 */
export function filterMirroredTransactions(transactions: FinancialTransaction[]): FinancialTransaction[] {
  const txs = [...transactions]
  const toRemove = new Set<string>()

  for (const bankTx of txs.filter((t) => t.source === 'bank-account' && t.amount < 0)) {
    const match = txs.find((t) => !toRemove.has(t.reference) && isMirrored(bankTx, t))
    if (match) {
      toRemove.add(bankTx.reference)
      toRemove.add(match.reference)
    }
  }

  for (const t212Tx of txs.filter(t => t.source === 'trading212' && t.amount < 0 && t.type === 'WITHDRAW')) {
    const bankMatch = txs.find(t =>
      !toRemove.has(t.reference) &&
      t.source === 'bank-account' &&
      t.amount > 0 &&
      t.type === 'DEPOSIT' &&
      Math.abs(Math.abs(t212Tx.amount) - t.amount) < MIRROR_TOLERANCE &&
      Math.abs(new Date(t212Tx.dateTime).getTime() - new Date(t.dateTime).getTime()) < MIRROR_WINDOW_MS
    )
    if (bankMatch) {
      toRemove.add(t212Tx.reference)
      toRemove.add(bankMatch.reference)
    }
  }

  return txs.filter((t) => !toRemove.has(t.reference))
}
export function getDateRange(mode: 'month' | 'week', offset: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (mode === 'month') {
    start.setMonth(now.getMonth() + offset)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    
    end.setMonth(now.getMonth() + offset + 1)
    end.setDate(0) 
    end.setHours(23, 59, 59, 999)
  } else {
    const currentDay = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - currentDay + offset * 7)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    start.setTime(startOfWeek.getTime())
    end.setTime(endOfWeek.getTime())
  }

  return { start, end }
}

export function formatRangeLabel(mode: 'month' | 'week', start: Date, end: Date): string {
  return mode === 'month'
    ? start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

export function calculateSpending(
  transactions: FinancialTransaction[], 
  range: { start: Date; end: Date }
): number {
  let total = 0
  let reimbursements = 0
  
  for (const tx of transactions) {
    const txDate = new Date(tx.dateTime)
    if (txDate < range.start || txDate > range.end) continue
    
    if (tx.amount < 0 && tx.type !== 'DEPOSIT') {
      total += Math.abs(tx.amount)
    }
    
    if (tx.category === 'reimbursement') {
      reimbursements += tx.amount
    }
  }
  
  return total - reimbursements
}

export function useActivityStats(transactions: ComputedRef<FinancialTransaction[]>) {
  const monthOffset = ref(0)
  const weekOffset = ref(0)

  function shiftMonth(delta: number) {
    const now = new Date()
    const newOffset = monthOffset.value + delta
    const target = new Date(now)
    target.setMonth(now.getMonth() + newOffset)
    
    if (target > now) return
    monthOffset.value = newOffset
  }

  function shiftWeek(delta: number) {
    const now = new Date()
    const newOffset = weekOffset.value + delta
    const target = new Date(now)
    target.setDate(now.getDate() + newOffset * 7)
    
    if (target > now) return
    weekOffset.value = newOffset
  }

  const monthRange = computed(() => getDateRange('month', monthOffset.value))
  const weekRange = computed(() => getDateRange('week', weekOffset.value))

  const monthSpending = computed(() => calculateSpending(transactions.value, monthRange.value))
  const weekSpending = computed(() => calculateSpending(transactions.value, weekRange.value))

  const monthLabel = computed(() => formatRangeLabel('month', monthRange.value.start, monthRange.value.end))
  const weekLabel = computed(() => formatRangeLabel('week', weekRange.value.start, weekRange.value.end))

  const stats = computed((): Stat[] => [
    {
      key: 'month',
      icon: 'i-lucide-calendar-range',
      title: 'Monthly Spending',
      value: monthSpending.value.toFixed(2),
      variation: 0, 
      label: monthLabel.value,
    },
    {
      key: 'week',
      icon: 'i-lucide-calendar-days', 
      title: 'Weekly Spending',
      value: weekSpending.value.toFixed(2),
      variation: 0,
      label: weekLabel.value,
    },
  ])

  return {
    monthOffset: readonly(monthOffset),
    weekOffset: readonly(weekOffset),
    
    shiftMonth,
    shiftWeek,
    
    monthRange,
    weekRange,
    monthSpending,
    weekSpending,
    monthLabel,
    weekLabel,
    stats
  }
}

export type TransactionRow = FinancialTransaction & {
  uid: string 
  dayKey: string 
  dayLabel: string 
}

export function prepareTransactionRows(transactions: FinancialTransaction[]): TransactionRow[] {
  const rows = transactions.map((tx) => {
    const date = new Date(tx.dateTime)
    
    const dayKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-')
    
    const dayLabel = date.toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
    
    const uid = `${tx.dateTime}|${tx.type}|${tx.amount}`
    
    return { ...tx, uid, dayKey, dayLabel }
  })

  const grouped: TransactionRow[] = []
  const interestByDay = new Map<string, TransactionRow[]>()
  
  for (const row of rows) {
    if (row.type === 'INTEREST/CASHBACK') {
      const existing = interestByDay.get(row.dayKey) || []
      existing.push(row)
      interestByDay.set(row.dayKey, existing)
    } else {
      grouped.push(row)
    }
  }
  
  for (const [dayKey, interests] of interestByDay) {
    const totalAmount = interests.reduce((sum, i) => sum + i.amount, 0)
    const first = interests[0]
    
    //@ts-ignore
    grouped.push({
      ...first,
      amount: totalAmount,
      uid: `${dayKey}-interest-grouped`,
      description: `Interest (${interests.length} payments)`
    })
  }
  
  return grouped
}

export const transactionUtils = {
  formatGBP: (amount: number): string => 
    amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }),

  getTypeColor: (type: string): string => {
    const colors: Record<string, string> = {
      DEPOSIT: 'success',
      WITHDRAW: 'error', 
      DIVIDEND: 'primary',
      FEE: 'warning'
    }
    return colors[type] || 'neutral'
  }
}

export function calculateIncome(
  transactions: FinancialTransaction[], 
  range: { start: Date; end: Date }
): number {
  let total = 0
  
  for (const tx of transactions) {
    const txDate = new Date(tx.dateTime)
    if (txDate < range.start || txDate > range.end) continue
    if (tx.amount <= 0) continue
    
    if (tx.source === 'bank-account') {
      if (tx.category === 'reimbursement') continue

      
      total += tx.amount 
    } else if (tx.type === 'INTEREST/CASHBACK') {
      total += tx.amount 
    }
  }
  
  return total
}