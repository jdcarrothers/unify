import type { CategoryRule } from '~/types/categorization'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Rule ID required' })
  }
  
  const storage = useStorage('data')
  const rules = await storage.getItem<CategoryRule[]>('category-rules.json') || []
  const filtered = rules.filter(r => r.id !== id)
  
  if (filtered.length === rules.length) {
    throw createError({ statusCode: 404, message: 'Rule not found' })
  }
  
  await storage.setItem('category-rules.json', filtered)
  
  return { success: true }
})
