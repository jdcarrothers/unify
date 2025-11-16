import { startOfMonth, addMonths, format } from 'date-fns'
import { filterMirroredTransactions } from '~/composables/useActivityStats'
import type { CategoryStats } from '~/types/categorization'

export function useCategoryStats(financeData: Ref<any>) {
  const { categorizeTransactions, calculateCategoryStats } = useCategorisation()
  
  const monthOffset = ref(0)

  const currentMonth = computed(() => {
    const now = new Date()
    return addMonths(startOfMonth(now), monthOffset.value)
  })

  const monthLabel = computed(() => 
    format(currentMonth.value, 'MMMM yyyy')
  )

  const canNavigateForward = computed(() => monthOffset.value < 0)

  function goToPreviousMonth() {
    monthOffset.value--
  }

  function goToNextMonth() {
    if (monthOffset.value < 0) {
      monthOffset.value++
    }
  }

  const transactions = computed(() => {
    if (!financeData.value?.transactions) return []
    const filtered = filterMirroredTransactions(financeData.value.transactions)
    return categorizeTransactions(filtered)
  })

  const monthTransactions = computed(() => {
    const monthStart = startOfMonth(currentMonth.value)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
    
    return transactions.value.filter(tx => {
      const date = new Date(tx.dateTime)
      return date >= monthStart && date <= monthEnd
    })
  })

  const reimbursements = computed(() => 
    monthTransactions.value.filter(t => t.amount > 0 && t.type !== 'INTEREST/CASHBACK')
  )

  const spending = computed(() => 
    monthTransactions.value.filter(t => t.amount < 0)
  )

  const stats = computed<CategoryStats[]>(() => {
    if (spending.value.length === 0) return []
    const baseStats = calculateCategoryStats(spending.value)
    
    const reimbursementsByCategory = new Map<string, number>()
    for (const reimb of reimbursements.value) {
      if (reimb.category && reimb.category !== 'Uncategorized') {
        const current = reimbursementsByCategory.get(reimb.category) || 0
        reimbursementsByCategory.set(reimb.category, current + reimb.amount)
      }
    }
    
    return baseStats.map(stat => {
      const reimbursed = reimbursementsByCategory.get(stat.categoryName) || 0
      return {
        ...stat,
        totalAmount: stat.totalAmount - reimbursed
      }
    }).filter(stat => stat.totalAmount > 0)
  })

  watch([transactions, monthOffset], () => {
    if (monthOffset.value === 0 && transactions.value.length > 0) {
      const monthStart = startOfMonth(currentMonth.value)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
      
      const hasCurrentMonthData = transactions.value.some(tx => {
        const date = new Date(tx.dateTime)
        return date >= monthStart && date <= monthEnd
      })
      
      if (!hasCurrentMonthData) {
        const sortedTx = [...transactions.value].sort((a, b) => 
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        )
        
        if (sortedTx.length > 0 && sortedTx[0]) {
          const mostRecentDate = new Date(sortedTx[0].dateTime)
          const now = new Date()
          const monthsDiff = (now.getFullYear() - mostRecentDate.getFullYear()) * 12 + 
                            (now.getMonth() - mostRecentDate.getMonth())
          
          monthOffset.value = -monthsDiff
        }
      }
    }
  }, { immediate: true })

  return {
    monthLabel,
    canNavigateForward,
    goToPreviousMonth,
    goToNextMonth,
    stats,
    reimbursements
  }
}
