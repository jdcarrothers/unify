import type { TransactionCategoryMap } from '~/types/categorization'

export default defineEventHandler(async () => {
  const storage = useStorage('data')
  const overrides = await storage.getItem<TransactionCategoryMap>('category-overrides.json')
  return overrides || {}
})
