import type { CategoryRule } from '~/types/categorization'

export default defineEventHandler(async (event) => {
  const body = await readBody<Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>>(event)
  
  const newRule: CategoryRule = {
    ...body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const storage = useStorage('data')
  const rules = await storage.getItem<CategoryRule[]>('category-rules.json') || []
  rules.push(newRule)
  await storage.setItem('category-rules.json', rules)
  
  return newRule
})
