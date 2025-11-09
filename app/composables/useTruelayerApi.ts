import { useTruelayerAuth } from './useTruelayerAuth'
import type { AccountInfo, CardInfo, TruelayerTransaction } from '~/types/truelayer'
import { TRUELAYER_DATA_BASE as API_URL } from '~/const'

export function useTruelayerApi() {
  const { getValidToken } = useTruelayerAuth()

  async function fetchJson<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
  }

  async function withAuthFetch<T = any>(path: string): Promise<T> {

    console.log('withAuthFetch', path)
    const token = await getValidToken()
    if (!token) throw new Error('Not authenticated')
    const headers = { Authorization: `Bearer ${token}` }
    return fetchJson<T>(`${API_URL}${path}`, { headers })
  }

  function normaliseTransaction(tx: any, source: 'card' | 'account'): TruelayerTransaction {
    const amount = source === 'card' ? -Math.abs(tx.amount) : tx.amount
    return {
      id: tx.transaction_id,
      timestamp: tx.timestamp,
      description: tx.description,
      merchant: tx.merchant_name,
      category: tx.transaction_category,
      classification: tx.transaction_classification,
      amount,
      currency: tx.currency,
      runningBalance: tx.running_balance?.amount ?? null,
      meta:
        source === 'card'
          ? { cardNumber: tx.meta?.cardNumber, location: tx.meta?.location }
          : { bankTransactionId: tx.meta?.bank_transaction_id },
    }
  }

  async function listAccounts(): Promise<AccountInfo[]> {
    const res = await withAuthFetch<{ results: AccountInfo[] }>('/accounts')
    return res.results ?? []
  }

  async function listCards(): Promise<CardInfo[]> {
    const res = await withAuthFetch<{ results: CardInfo[] }>('/cards')
    return res.results ?? []
  }

  async function getAccountTransactions(id: string): Promise<TruelayerTransaction[]> {
    const res = await withAuthFetch<{ results: any[] }>(`/accounts/${id}/transactions`)
    return (res.results ?? []).map((tx) => normaliseTransaction(tx, 'account'))
  }

  async function getCardTransactions(id: string): Promise<TruelayerTransaction[]> {
    const res = await withAuthFetch<{ results: any[] }>(`/cards/${id}/transactions`)
    return (res.results ?? []).map((tx) => normaliseTransaction(tx, 'card'))
  }

  async function getAccountBalance(id: string): Promise<number | null> {
    const res = await withAuthFetch<{ results: { current?: number }[] }>(
      `/accounts/${id}/balance`
    )
    return res.results?.[0]?.current ?? null
  }

  async function getCardBalance(id: string): Promise<number | null> {
    const res = await withAuthFetch<{ results: { current?: number }[] }>(
      `/cards/${id}/balance`
    )
    return res.results?.[0]?.current ?? null
  }

  return {
    listAccounts,
    listCards,
    getAccountTransactions,
    getCardTransactions,
    getAccountBalance,
    getCardBalance,
  }
}
