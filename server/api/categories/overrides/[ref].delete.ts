import type { TransactionCategoryMap } from '~/types/categorization'

export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, 'ref')
  if (!ref) {
    throw createError({ statusCode: 400, message: 'Transaction reference required' })
  }
  
  const storage = useStorage('data')
  const overrides = await storage.getItem<TransactionCategoryMap>('category-overrides.json') || {}
  delete overrides[ref]
  await storage.setItem('category-overrides.json', overrides)
  
  return { success: true }
})
