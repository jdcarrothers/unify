import type { CategoryRule, CategoryMatch, CategoryStats, TransactionCategoryMap } from '~/types/categorization'
import type { FinancialTransaction } from '~/types'
import { useDemoMode } from '~/composables/useDemoMode'

export function useCategorisation() {
  const { isDemoMode } = useDemoMode()
  
  // Fetch rules from server (demo or live)
  async function getRules(): Promise<CategoryRule[]> {
    try {
      const endpoint = isDemoMode.value 
        ? '/api/categories/demo/rules' 
        : '/api/categories/rules'
      const data = await $fetch<CategoryRule[]>(endpoint)
      return data
    } catch (error) {
      console.error('Failed to fetch category rules:', error)
      return []
    }
  }

  async function saveRules(rules: CategoryRule[]) {
    if (isDemoMode.value) {
      console.warn('Cannot save rules in demo mode')
      return
    }
    // This is handled by individual create/update/delete operations
  }

  async function createRule(rule: Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryRule | null> {
    if (isDemoMode.value) {
      console.warn('Cannot create rules in demo mode')
      return null
    }
    
    try {
      const newRule = await $fetch<CategoryRule>('/api/categories/rules', {
        method: 'POST',
        body: rule
      })
      return newRule
    } catch (error) {
      console.error('Failed to create rule:', error)
      return null
    }
  }

  async function updateRule(id: string, updates: Partial<Omit<CategoryRule, 'id' | 'createdAt'>>): Promise<CategoryRule | null> {
    if (isDemoMode.value) {
      console.warn('Cannot update rules in demo mode')
      return null
    }
    
    try {
      const updated = await $fetch<CategoryRule>(`/api/categories/rules/${id}`, {
        method: 'PUT',
        body: updates
      })
      return updated
    } catch (error) {
      console.error('Failed to update rule:', error)
      return null
    }
  }

  async function deleteRule(id: string): Promise<boolean> {
    if (isDemoMode.value) {
      console.warn('Cannot delete rules in demo mode')
      return false
    }
    
    try {
      await $fetch(`/api/categories/rules/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Failed to delete rule:', error)
      return false
    }
  }

  async function getOverrides(): Promise<TransactionCategoryMap> {
    try {
      const endpoint = isDemoMode.value 
        ? '/api/categories/demo/overrides' 
        : '/api/categories/overrides'
      const data = await $fetch<TransactionCategoryMap>(endpoint)
      return data
    } catch (error) {
      console.error('Failed to fetch overrides:', error)
      return {}
    }
  }

  async function saveOverrides(overrides: TransactionCategoryMap) {
    if (isDemoMode.value) {
      console.warn('Cannot save overrides in demo mode')
      return
    }
    // This is handled by individual set/remove operations
  }

  async function setTransactionCategory(transactionRef: string, categoryName: string): Promise<void> {
    if (isDemoMode.value) {
      console.warn('Cannot set transaction categories in demo mode')
      return
    }
    
    try {
      await $fetch('/api/categories/overrides', {
        method: 'POST',
        body: { transactionRef, categoryName }
      })
    } catch (error) {
      console.error('Failed to set transaction category:', error)
    }
  }

  async function removeTransactionOverride(transactionRef: string): Promise<void> {
    if (isDemoMode.value) {
      console.warn('Cannot remove transaction overrides in demo mode')
      return
    }
    
    try {
      await $fetch(`/api/categories/overrides/${transactionRef}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to remove transaction override:', error)
    }
  }

  async function matchTransaction(description: string, transactionRef?: string): Promise<CategoryMatch> {
    const overrides = await getOverrides()
    
    if (transactionRef) {
      const overrideCategory = overrides[transactionRef]
      if (overrideCategory) {
        const rules = await getRules()
        const rule = rules.find(r => r.name === overrideCategory)
        return {
          category: overrideCategory,
          rule,
          isUncategorized: false
        }
      }
    }

    const rules = await getRules()
    const lowerDesc = description.toLowerCase().trim()
    
    for (const rule of rules) {
      const hasMatch = rule.keywords.some(keyword => 
        lowerDesc.includes(keyword.toLowerCase().trim())
      )
      
      if (hasMatch) {
        return {
          category: rule.name,
          rule,
          isUncategorized: false
        }
      }
    }
    
    return {
      category: 'Uncategorized',
      isUncategorized: true
    }
  }

  async function categorizeTransaction(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    const match = await matchTransaction(transaction.description, transaction.reference)
    return {
      ...transaction,
      category: match.category
    }
  }

  async function categorizeTransactions(transactions: FinancialTransaction[]): Promise<FinancialTransaction[]> {
    // Batch fetch rules and overrides once
    const [rules, overrides] = await Promise.all([getRules(), getOverrides()])
    
    return transactions.map(transaction => {
      // Check override first
      const overrideCategory = transaction.reference ? overrides[transaction.reference] : undefined
      
      if (overrideCategory) {
        return { ...transaction, category: overrideCategory }
      }
      
      // Match by keywords
      const lowerDesc = transaction.description.toLowerCase().trim()
      const matchedRule = rules.find(rule =>
        rule.keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase().trim()))
      )
      
      return {
        ...transaction,
        category: matchedRule?.name || 'Uncategorized'
      }
    })
  }

  async function calculateCategoryStats(transactions: FinancialTransaction[]): Promise<CategoryStats[]> {
    const rules = await getRules()
    const categorized = await categorizeTransactions(transactions)
    
    const categoryMap = new Map<string, FinancialTransaction[]>()
    
    for (const tx of categorized) {
      const category = tx.category || 'Uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(tx)
    }
    
    const totalSpending = categorized
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
    
    const stats: CategoryStats[] = []
    
    for (const [categoryName, txs] of categoryMap.entries()) {
      const rule = rules.find(r => r.name === categoryName)
      const categorySpending = txs
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
      
      stats.push({
        categoryName,
        totalAmount: categorySpending,
        percentage: totalSpending > 0 ? (categorySpending / totalSpending) * 100 : 0,
        transactionCount: txs.length,
        color: rule?.color || '#6b7280',
        icon: rule?.icon || 'lucide:folder',
        transactions: txs.sort((a, b) => 
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        ),
        rule
      })
    }
    
    return stats.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  return {
    // CRUD
    getRules,
    createRule,
    updateRule,
    deleteRule,
    
    // Overrides
    getOverrides,
    setTransactionCategory,
    removeTransactionOverride,
    
    // Matching
    matchTransaction,
    categorizeTransaction,
    categorizeTransactions,
    
    // Stats
    calculateCategoryStats
  }
}
