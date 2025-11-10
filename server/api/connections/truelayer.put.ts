import { defineEventHandler } from 'h3'
import { useCache } from '~/composables/useCache'
import { useTruelayerApi } from '~/composables/useTruelayerApi'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'
import { enrichWithBalances } from '~/utils/shared'

export default defineEventHandler(async () => {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const { data } = await cache.read()
  const config = data ?? {}

  if (!config.trueLayerAccount) {
    return { error: 'No TrueLayer account linked.' }
  }

  const api = useTruelayerApi()

  try {
    const [accounts, cards] = await Promise.all([
      api.listAccounts(),
      api.listCards(),
    ])

    const accountsWithBalances = await enrichWithBalances(
      accounts,
      (id) => api.getAccountBalance(id),
      (acc) => acc.account_id
    )

    const cardsWithBalances = await enrichWithBalances(
      cards,
      (id) => api.getCardBalance(id),
      (card) => card.account_id
    )

    const updated: UserConfig = {
      ...config,
      trueLayerAccount: {
        ...config.trueLayerAccount,
        Accounts: accountsWithBalances,
        Cards: cardsWithBalances,
      },
      lastSyncedAt: new Date().toISOString(),
    }

    await cache.write(updated)

    return {
      message: 'TrueLayer accounts/cards initialised.',
      accounts: accountsWithBalances.length,
      cards: cardsWithBalances.length,
      updatedAt: new Date().toISOString(),
    }
  } catch (err: any) {
    console.error('TrueLayer init failed:', err)
    return { error: `Failed to fetch TrueLayer data: ${err.message}` }
  }
})
