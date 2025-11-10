import { defineEventHandler } from 'h3'
import { useCache } from '~/composables/useCache'
import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async () => {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const { data: currentConfig } = await cache.read()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const updatedConfig: UserConfig = {
    ...(currentConfig ?? {}),
    lastSyncedAt: yesterday,
  }

  await cache.write(updatedConfig)

  return {
    ok: true,
    lastSyncedAt: yesterday,
  }
})
