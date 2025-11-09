import { defineEventHandler } from 'h3'
import { useCache } from '~/composables/useCache'
import { useTruelayerApi } from '~/composables/useTruelayerApi'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async () => {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const current = await cache.read()
  const config = current.data ?? {}

  if (!config.trueLayerAccount) {
    return { error: 'No TrueLayer account linked.' }
  }

  const api = useTruelayerApi()

  try {
    const [accounts, cards] = await Promise.all([
      api.listAccounts(),
      api.listCards(),
    ])

    const accountsWithBalances = await Promise.all(
      accounts.map(async (acc) => {
        const bal = await api.getAccountBalance(acc.account_id)
        return { ...acc, balance: bal ?? undefined }
      })
    )

    const cardsWithBalances = await Promise.all(
      cards.map(async (card) => {
        const bal = await api.getCardBalance(card.account_id)
        return { ...card, balance: bal ?? undefined }
      })
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
