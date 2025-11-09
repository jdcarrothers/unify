import { defineEventHandler } from 'h3'
import { useCache } from '~/composables/useCache'
import { useTruelayerAuth } from '~/composables/useTruelayerAuth'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async () => {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const current = await cache.read()
  const config = current.data ?? {}

  const { getAuthLink, getValidToken } = useTruelayerAuth()

  if (!config.trueLayerAccount) {
    return { authLink: getAuthLink() }
  }

  const validToken = await getValidToken()
  if (!validToken) {
    await cache.write({ ...config, trueLayerAccount: undefined })
    return { authLink: getAuthLink() }
  }

  return {
    message: 'TrueLayer already connected.',
    connected: true,
    trueLayerAccount: {
      expires_at: config.trueLayerAccount.expires_at,
      hasAccounts: !!config.trueLayerAccount.Accounts?.length,
      hasCards: !!config.trueLayerAccount.Cards?.length,
    },
  }
})
