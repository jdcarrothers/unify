import { useTruelayerApi } from './useTruelayerApi'
import { useCache } from './useCache'
import type { TruelayerTransaction } from '~/types/truelayer'
import type { CachedCardData } from '~/types/truelayer'
import { CARDS_CACHE_FILE as CACHE_FILE } from '~/const'

export function useTruelayerCards() {
  const api = useTruelayerApi()
  const cache = useCache<CachedCardData[]>(CACHE_FILE)

  async function getCachedCards(): Promise<CachedCardData[]> {
    const cached = await cache.read()
    const stale = await cache.isStale()

    if (!stale && cached.data) {
      return cached.data
    }

    const cards = await api.listCards()
    if (!cards?.length) throw new Error('No TrueLayer cards found')

    const mergedCards: CachedCardData[] = []

    for (const card of cards) {
      const balance = (await api.getCardBalance(card.account_id)) ?? 0
      const newTransactions: TruelayerTransaction[] =
        await api.getCardTransactions(card.account_id)

      const existingCard = cached.data?.find(
        (c) => c.card.account_id === card.account_id
      )
      const existingTxs = existingCard?.transactions ?? []

      const mergedMap = new Map<string, TruelayerTransaction>()
      for (const tx of existingTxs) mergedMap.set(tx.id, tx)
      for (const tx of newTransactions) mergedMap.set(tx.id, tx)

      const mergedTransactions = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      mergedCards.push({
        card: { ...card, balance },
        balance,
        transactions: mergedTransactions,
        transactionCount: mergedTransactions.length,
        lastUpdated: new Date().toISOString(),
      })
    }

    await cache.write(mergedCards)
    return mergedCards
  }

  return { getCachedCards }
}
