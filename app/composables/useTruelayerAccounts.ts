import { useTruelayerApi } from './useTruelayerApi'
import { useCache } from './useCache'
import type { TruelayerTransaction, CachedAccountData } from '~/types/truelayer'
import { ACCOUNTS_CACHE_FILE as CACHE_FILE } from '~/const'

export function useTruelayerAccounts() {
  const api = useTruelayerApi()
  const cache = useCache<CachedAccountData[]>(CACHE_FILE)

  async function getCachedAccounts(): Promise<CachedAccountData[]> {
    const cached = await cache.read()
    const stale = await cache.isStale()

    if (!stale && cached.data) {
      return cached.data
    }

    const accounts = await api.listAccounts()
    if (!accounts?.length) throw new Error('No TrueLayer bank accounts found')

    const mergedAccounts: CachedAccountData[] = []

    for (const account of accounts) {
      const balance = (await api.getAccountBalance(account.account_id)) ?? 0
      const newTransactions: TruelayerTransaction[] =
        await api.getAccountTransactions(account.account_id)

      const existingAccount = cached.data?.find(
        (a) => a.account.account_id === account.account_id
      )
      const existingTxs = existingAccount?.transactions ?? []

      const mergedMap = new Map<string, TruelayerTransaction>()
      for (const tx of existingTxs) mergedMap.set(tx.id, tx)
      for (const tx of newTransactions) mergedMap.set(tx.id, tx)

      const mergedTransactions = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      mergedAccounts.push({
        account: { ...account, balance },
        balance,
        transactions: mergedTransactions,
        transactionCount: mergedTransactions.length,
        lastUpdated: new Date().toISOString(),
      })
    }

    await cache.write(mergedAccounts)
    return mergedAccounts
  }

  return { getCachedAccounts }
}
