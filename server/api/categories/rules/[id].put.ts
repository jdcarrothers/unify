import type { CategoryRule } from '~/types/categorization'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Rule ID required' })
  }
  
  const updates = await readBody<Partial<Omit<CategoryRule, 'id' | 'createdAt'>>>(event)
  
  const storage = useStorage('data')
  const rules = await storage.getItem<CategoryRule[]>('category-rules.json') || []
  const index = rules.findIndex(r => r.id === id)
  
  if (index === -1) {
    throw createError({ statusCode: 404, message: 'Rule not found' })
  }
  
  const existing = rules[index]!
  const updated: CategoryRule = {
    id: existing.id,
    name: updates.name ?? existing.name,
    keywords: updates.keywords ?? existing.keywords,
    color: updates.color ?? existing.color,
    icon: updates.icon ?? existing.icon,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  }
  
  rules[index] = updated
  await storage.setItem('category-rules.json', rules)
  
  return updated
})
