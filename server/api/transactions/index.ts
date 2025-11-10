import { useCache } from '~/composables/useCache'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'
import { useTruelayerCards } from '~/composables/useTruelayerCards'
import { useTruelayerAccounts } from '~/composables/useTruelayerAccounts'
import { useTrading } from '~/composables/useTrading'
import type { CombinedFinancialData, FinancialTransaction } from '~/types'
import { sortByDate, sumBalances } from '~/utils/shared'

export default defineEventHandler(async () => {
  const cfgCache = useCache<UserConfig>(USER_CONFIG_FILE)
  const { data } = await cfgCache.read()
  const cfg = data ?? {}

  const tradingConnected = !!cfg.trading212Account
  const hasCards = (cfg.trueLayerAccount?.Cards?.length ?? 0) > 0
  const hasAccounts = (cfg.trueLayerAccount?.Accounts?.length ?? 0) > 0

  const [cardsData, accountsData, tradingData] = await Promise.all([
    hasCards ? useTruelayerCards().getCachedCards() : Promise.resolve([]),
    hasAccounts ? useTruelayerAccounts().getCachedAccounts() : Promise.resolve([]),
    tradingConnected ? (await useTrading()).getCachedAccount() : Promise.resolve(null),
  ])

  const cardsOwed = sumBalances(cardsData as any[], (balance) => Math.max(0, balance))
  const accountsBalanceSum = sumBalances(accountsData as any[])

  const tradingBalance = Number(tradingData?.balance ?? 0)

  const totalBalance = accountsBalanceSum + tradingBalance - cardsOwed

  const cardTransactions: FinancialTransaction[] = sortByDate(
    (cardsData as any[])
      .flatMap((c) => c.transactions ?? [])
      .map((tx: any) => ({
        type: Number(tx.amount) < 0 ? 'WITHDRAW' : 'DEPOSIT',
        amount: Number(tx.amount),
        reference: String(tx.id ?? ''),
        dateTime: String(tx.timestamp ?? new Date(0).toISOString()),
        source: 'credit-card',
      }))
  )

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
    ...cardTransactions,
    ...accountTransactions,
    ...tradingTransactions,
  ])

  const bankWithdrawKeys = new Set(
    allTransactions
      .filter((t) => t.source === 'bank-account' && t.type === 'WITHDRAW')
      .map((t) => {
        const dateKey = new Date(t.dateTime).toISOString().slice(0, 10)
        const amountKey = Math.abs(Number(t.amount)).toFixed(2)
        return `${dateKey}:${amountKey}`
      })
  )

  allTransactions = allTransactions.filter((t) => {
    if (t.source !== 'credit-card' || t.type !== 'WITHDRAW') return true
    const dateKey = new Date(t.dateTime).toISOString().slice(0, 10)
    const amountKey = Math.abs(Number(t.amount)).toFixed(2)
    return !bankWithdrawKeys.has(`${dateKey}:${amountKey}`)
  })

  const combinedData: CombinedFinancialData = {
    transactions: allTransactions,
    totalBalance,
  }

  const nowIso = new Date().toISOString()
  const updatedCfg: UserConfig = { ...(cfg ?? {}), lastSyncedAt: nowIso }
  await cfgCache.write(updatedCfg)

  return combinedData
})
