export type T212TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'INTEREST/CASHBACK'

export interface T212Transaction {
  type: T212TransactionType
  amount: number
  reference: string
  dateTime: string
}

export interface CachedTransactions {
  transactions: T212Transaction[]
  transactionCount: number
  lastUpdated: string
  balance?: number
}