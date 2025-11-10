import type { UserConfig } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export interface CacheFile<T> {
  lastUpdated: string | null
  data: T | null
}

const STALE_AFTER_HOURS = 1

function getStorage() {
  if (import.meta.server) {
    return useStorage('data')
  }
  return {
    async getItem(key: string) {
      if (typeof window === 'undefined') return null
      const item = localStorage.getItem(`nuxt:data:${key}`)
      return item ? JSON.parse(item) : null
    },
    async setItem(key: string, value: any) {
      if (typeof window === 'undefined') return
      localStorage.setItem(`nuxt:data:${key}`, JSON.stringify(value))
    }
  }
}

function hoursSince(iso?: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
}

async function readUserLastSyncedAt(): Promise<string | null> {
  const storage = getStorage()
  const raw = (await storage.getItem(USER_CONFIG_FILE)) as unknown

  if (!raw || typeof raw !== 'object') return null

  if ('data' in (raw as any)) {
    const cf = raw as CacheFile<UserConfig>
    return cf?.data?.lastSyncedAt ?? null
  }

  return (raw as UserConfig).lastSyncedAt ?? null
}

export function useCache<T = any>(fileName: string) {
  async function read(): Promise<CacheFile<T>> {
    const storage = getStorage()
    return (
      ((await storage.getItem(fileName)) as CacheFile<T> | null) ?? {
        lastUpdated: null,
        data: null,
      }
    )
  }

  async function write(data: T) {
    const storage = getStorage()
    const cache: CacheFile<T> = {
      lastUpdated: new Date().toISOString(),
      data,
    }
    await storage.setItem(fileName, cache)
  }

  async function isStale(maxHours: number = STALE_AFTER_HOURS): Promise<boolean> {
    const lastSyncedAt = await readUserLastSyncedAt()
    return hoursSince(lastSyncedAt) > maxHours
  }

  async function getLastSyncedAt(): Promise<string | null> {
    return await readUserLastSyncedAt()
  }

  return { read, write, isStale, getLastSyncedAt }
}
