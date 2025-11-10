import { useCache } from '~/composables/useCache'

export function useCacheWithDefaults<T>(fileName: string, defaultValue: T) {
  const cache = useCache<T>(fileName)
  
  async function read(): Promise<T> {
    const { data } = await cache.read()
    return data ?? defaultValue
  }
  
  async function write(data: T): Promise<void> {
    return cache.write(data)
  }
  
  async function isStale(maxHours?: number): Promise<boolean> {
    return cache.isStale(maxHours)
  }
  
  return { read, write, isStale }
}