import type { TransactionCategoryMap } from '~/types/categorization'

interface SetOverrideBody {
  transactionRef: string
  categoryName: string
}

export default defineEventHandler(async (event) => {
  const { transactionRef, categoryName } = await readBody<SetOverrideBody>(event)
  
  if (!transactionRef || !categoryName) {
    throw createError({ statusCode: 400, message: 'transactionRef and categoryName required' })
  }
  
  const storage = useStorage('data')
  const overrides = await storage.getItem<TransactionCategoryMap>('category-overrides.json') || {}
  overrides[transactionRef] = categoryName
  await storage.setItem('category-overrides.json', overrides)
  
  return { success: true, overrides }
})
