export type TokenCache = {
  access_token: string
  refresh_token: string
  expires_at: number
}

export type AccountInfo = {
  account_id: string
  display_name?: string
  currency?: string
  type?: string
  balance?: number
}

export type CardInfo = {
  account_id: string
  display_name?: string
  currency?: string
  card_network?: string
  card_type?: string
  balance?: number
  credit_limit?: number
}

export type TruelayerTransaction = {
  id: string
  timestamp: string
  description: string
  merchant?: string
  transaction_type?: string
  transaction_category?: string
  amount: number
  currency: string
  runningBalance: number | null
  meta: Record<string, any>
}

export interface CachedCardData {
  card: CardInfo
  balance: number
  transactions: TruelayerTransaction[]
  transactionCount: number
  lastUpdated: string
}

export interface CachedAccountData {
  account: AccountInfo
  balance: number
  transactions: TruelayerTransaction[]
  transactionCount: number
  lastUpdated: string
}