import type { CombinedFinancialData } from '~/types'

export type FinanceSource = 'trading212' | 'bank-account' | 'credit-card'

export type FinanceStreamStatus =
  | { source: FinanceSource; state: 'pending' }
  | { source: FinanceSource; state: 'ready' }
  | { source: FinanceSource; state: 'error'; error: string }

export type FinanceStreamUpdate = {
  source: FinanceSource
  data: CombinedFinancialData | any
}

export type FinanceStreamEvent =
  | { type: 'status'; payload: FinanceStreamStatus }
  | { type: 'update'; payload: FinanceStreamUpdate }
  | { type: 'ping'; payload: {} }
