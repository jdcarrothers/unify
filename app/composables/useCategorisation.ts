import type { CategoryRule, CategoryMatch, CategoryStats, TransactionCategoryMap } from '~/types/categorization'
import type { FinancialTransaction } from '~/types'

const RULES_STORAGE_KEY = 'unify-category-rules'
const OVERRIDES_STORAGE_KEY = 'unify-transaction-category-overrides'

export function useCategorisation() {
  function getRules(): CategoryRule[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(RULES_STORAGE_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as CategoryRule[]
    } catch {
      return []
    }
  }

  function saveRules(rules: CategoryRule[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules))
  }

  function createRule(rule: Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>): CategoryRule {
    const newRule: CategoryRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const rules = getRules()
    rules.push(newRule)
    saveRules(rules)
    return newRule
  }

  function updateRule(id: string, updates: Partial<Omit<CategoryRule, 'id' | 'createdAt'>>): CategoryRule | null {
    const rules = getRules()
    const index = rules.findIndex(r => r.id === id)
    if (index === -1) return null
    
    const existing = rules[index]
    if (!existing) return null
    
    const updated: CategoryRule = {
      id: existing.id,
      name: updates.name ?? existing.name,
      keywords: updates.keywords ?? existing.keywords,
      color: updates.color ?? existing.color,
      icon: updates.icon ?? existing.icon,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    }
    rules[index] = updated
    saveRules(rules)
    return updated
  }

  function deleteRule(id: string): boolean {
    const rules = getRules()
    const filtered = rules.filter(r => r.id !== id)
    if (filtered.length === rules.length) return false
    saveRules(filtered)
    return true
  }

  function getOverrides(): TransactionCategoryMap {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem(OVERRIDES_STORAGE_KEY)
    if (!stored) return {}
    try {
      return JSON.parse(stored) as TransactionCategoryMap
    } catch {
      return {}
    }
  }

  function saveOverrides(overrides: TransactionCategoryMap) {
    if (typeof window === 'undefined') return
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides))
  }

  function setTransactionCategory(transactionRef: string, categoryName: string) {
    const overrides = getOverrides()
    overrides[transactionRef] = categoryName
    saveOverrides(overrides)
  }

  function removeTransactionOverride(transactionRef: string) {
    const overrides = getOverrides()
    delete overrides[transactionRef]
    saveOverrides(overrides)
  }

  function matchTransaction(description: string, transactionRef?: string): CategoryMatch {
    if (transactionRef) {
      const overrides = getOverrides()
      const overrideCategory = overrides[transactionRef]
      if (overrideCategory) {
        const rules = getRules()
        const rule = rules.find(r => r.name === overrideCategory)
        return {
          category: overrideCategory,
          rule,
          isUncategorized: false
        }
      }
    }

    const rules = getRules()
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

  function categorizeTransaction(transaction: FinancialTransaction): FinancialTransaction {
    const match = matchTransaction(transaction.description, transaction.reference)
    return {
      ...transaction,
      category: match.category
    }
  }

  function categorizeTransactions(transactions: FinancialTransaction[]): FinancialTransaction[] {
    return transactions.map(categorizeTransaction)
  }

  function calculateCategoryStats(transactions: FinancialTransaction[]): CategoryStats[] {
    const rules = getRules()
    const categorized = categorizeTransactions(transactions)
    
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
