
import type { CardInfo, AccountInfo } from './truelayer'

export interface Trading212Account {
  key: string
  secret: string
  addedAt: string
}

export interface TrueLayerAccount {
    access_token: string
    refresh_token: string
    expires_at: number
    Cards: CardInfo[]
    Accounts: AccountInfo[]
}

export interface UserConfig {
  trading212Account?: Trading212Account
  trueLayerAccount?: TrueLayerAccount
  lastSyncedAt?: string
}