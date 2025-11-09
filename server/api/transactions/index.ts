// server/api/transactions.get.ts (or .post.ts if you prefer)
import { useCache } from '~/composables/useCache'
import { USER_CONFIG_FILE } from '~/const'
import type { UserConfig } from '~/types/connections'

import { useTruelayerAccounts } from '~/composables/useTruelayerAccounts'
import { useTrading } from '~/composables/useTrading'
import type { CombinedFinancialData, FinancialTransaction } from '~/types'

function sortByDate<T extends { dateTime?: string; timestamp?: string }>(list: T[]): T[] {
  return list.sort(
    (a, b) =>
      new Date(a.dateTime || a.timestamp || 0).getTime() -
      new Date(b.dateTime || b.timestamp || 0).getTime()
  )
}

export default defineEventHandler(async () => {
  const cfgCache = useCache<UserConfig>(USER_CONFIG_FILE)
  const cfgFile = await cfgCache.read()
  const cfg: UserConfig = (cfgFile.data ?? {}) as UserConfig

  const tradingConnected = !!cfg.trading212Account
  const hasAccounts = cfg.trueLayerAccount?.Accounts

  const accountsApi = useTruelayerAccounts()

  const [accountsData, tradingData] = await Promise.all([
    hasAccounts ? accountsApi.getCachedAccounts() : Promise.resolve([]),
    tradingConnected ? (await useTrading()).getCachedAccount() : Promise.resolve(null),
  ])

  const accountsBalanceSum = (accountsData as any[]).reduce(
    (s, a) => s + Number(a.balance ?? 0),
    0
  )

  const tradingBalance = Number(tradingData?.balance ?? 0)

  const totalBalance = accountsBalanceSum + tradingBalance


  const accountTransactions: FinancialTransaction[] = sortByDate(
    (accountsData as any[])
      .flatMap((a) => a.transactions ?? [])
      .map((tx: any) => ({
        type: Number(tx.amount) > 0 ? 'DEPOSIT' : 'WITHDRAW',
        amount: Number(tx.amount),
        reference: String(tx.id ?? ''),
        dateTime: new Date(tx.timestamp).toISOString(),
        source: 'bank-account',
      }))
  )

  const tradingTransactions: FinancialTransaction[] = sortByDate(
    (tradingData?.transactions ?? []).map((tx: any) => ({
      type: tx.type,
      amount: Number(tx.amount),
      reference: String(tx.reference ?? ''),
      dateTime: String(tx.dateTime ?? new Date(0).toISOString()),
      source: 'trading212',
    }))
  )

  let allTransactions = sortByDate([
    ...accountTransactions,
    ...tradingTransactions,
  ])

  const combinedData: CombinedFinancialData = {
    transactions: allTransactions,
    totalBalance,
  }

  const nowIso = new Date().toISOString()
  const updatedCfg: UserConfig = { ...(cfg ?? {}), lastSyncedAt: nowIso }
  await cfgCache.write(updatedCfg)

  return combinedData
})
