import type { CategoryRule } from '~/types/categorization'

export default defineEventHandler(async () => {
  const storage = useStorage('data')
  const rules = await storage.getItem<CategoryRule[]>('category-rules.json')
  return rules || []
})
