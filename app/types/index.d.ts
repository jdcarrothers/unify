import type { AvatarProps } from '@nuxt/ui'

export interface Stat {
  title: string
  key?: string
  icon: string
  value: number | string
  variation: number
  label?: string
  formatter?: (value: number) => string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface FinancialTransaction {
  type: T212TransactionType
  amount: number
  reference: string
  dateTime: string
  source: string
}

export interface CombinedFinancialData {
  totalBalance: number
  transactions: FinancialTransaction[]
}


