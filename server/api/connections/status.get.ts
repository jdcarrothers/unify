import { defineEventHandler } from 'h3'
import { useCache } from '~/composables/useCache'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async () => {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const { data, lastUpdated } = await cache.read()
  const cfg = data ?? {}

  const now = Date.now()
  const tl = cfg.trueLayerAccount

  const expiresAt = tl?.expires_at ?? null
  const expiresInMs = expiresAt ? Math.max(0, expiresAt - now) : null

  return {
    lastUpdated,
    lastSyncedAt: cfg.lastSyncedAt ?? null,

    trading212: {
      connected: !!cfg.trading212Account,
      addedAt: cfg.trading212Account?.addedAt ?? null,
    },

    truelayer: {
      connected: !!tl,
      expiresAt,
      expiresInSeconds: expiresInMs ? Math.floor(expiresInMs / 1000) : null,
      isExpired: !!expiresAt && expiresAt <= now,
      connectedAccounts: tl?.Accounts, 
      connectedCards: tl?.Cards
    },
  }
})
