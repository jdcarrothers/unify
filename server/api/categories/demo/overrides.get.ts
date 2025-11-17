import type { TransactionCategoryMap } from '~/types/categorization'

// Demo transaction overrides - manually categorized transactions
const demoOverrides: TransactionCategoryMap = {
  // Some example manual overrides
  'Pharmacy - Boots_demo-override-1': 'Health & Fitness',
  'Amazon Prime_demo-override-2': 'Subscriptions',
  'Public Transport_demo-override-3': 'Transport'
}

export default defineEventHandler(async () => {
  return demoOverrides
})
