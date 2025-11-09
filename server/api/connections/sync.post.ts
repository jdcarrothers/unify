// server/api/connections/sync.post.ts
import { defineEventHandler } from 'h3'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async () => {
  const storage = useStorage('data')
  const raw = (await storage.getItem(USER_CONFIG_FILE)) as any

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let updated: any
  if (raw && typeof raw === 'object' && 'data' in raw) {
    updated = {
      ...raw,
      data: { ...(raw.data ?? {}), lastSyncedAt: yesterday },
      lastUpdated: new Date().toISOString(),
    }
  } else if (raw && typeof raw === 'object') {
    updated = { ...raw, lastSyncedAt: yesterday }
  } else {
    updated = { lastSyncedAt: yesterday }
  }

  await storage.setItem(USER_CONFIG_FILE, updated)

  return {
    ok: true,
    lastSyncedAt: 'data' in updated ? updated.data.lastSyncedAt : updated.lastSyncedAt,
  }
})
