export interface CategoryRule {
  id: string
  name: string
  keywords: string[]
  color: string
  icon: string
  createdAt: string
  updatedAt: string
}

export interface CategoryMatch {
  category: string
  rule?: CategoryRule
  isUncategorized: boolean
}

export interface CategoryStats {
  categoryName: string
  totalAmount: number
  percentage: number
  transactionCount: number
  color: string
  icon: string
  transactions: import('./index').FinancialTransaction[]
  rule?: CategoryRule
}

// Map of transaction reference -> category id for user overrides
export type TransactionCategoryMap = Record<string, string>
