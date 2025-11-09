const LOCKS_BUCKET = 'lock'           
const DEFAULT_TTL_MS = 60_000          

type LockPayload = { acquiredAt: string; expiresAt: number; owner?: string }

export async function acquireLock(key: string, ttlMs = DEFAULT_TTL_MS, owner?: string): Promise<boolean> {
  const storage = useStorage(LOCKS_BUCKET)
  const now = Date.now()
  const current = (await storage.getItem<LockPayload>(key)) as LockPayload | null

  if (current && current.expiresAt > now) {
    return false 
  }

  const payload: LockPayload = {
    acquiredAt: new Date().toISOString(),
    expiresAt: now + ttlMs,
    owner,
  }
  await storage.setItem(key, payload)
  return true
}

export async function releaseLock(key: string, owner?: string): Promise<void> {
  const storage = useStorage(LOCKS_BUCKET)
  await storage.removeItem(key)
}
