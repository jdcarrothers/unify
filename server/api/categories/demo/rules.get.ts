import type { CategoryRule } from '~/types/categorization'

// Demo category rules with realistic data
const demoRules: CategoryRule[] = [
  {
    id: 'demo-groceries',
    name: 'Groceries',
    keywords: ['tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl', 'waitrose', 'co-op', 'marks & spencer'],
    color: '#10b981',
    icon: 'lucide:shopping-cart',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'demo-transport',
    name: 'Transport',
    keywords: ['uber', 'tfl', 'trainline', 'national rail', 'bus', 'transport'],
    color: '#3b82f6',
    icon: 'lucide:car',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 25).toISOString()
  },
  {
    id: 'demo-fuel',
    name: 'Fuel',
    keywords: ['shell', 'bp', 'esso', 'texaco', 'petrol', 'fuel'],
    color: '#f59e0b',
    icon: 'lucide:fuel',
    createdAt: new Date(Date.now() - 86400000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 28).toISOString()
  },
  {
    id: 'demo-dining',
    name: 'Dining Out',
    keywords: ['restaurant', 'pret', 'starbucks', 'costa', 'cafe', 'pizza', 'mcdonald', 'kfc', 'nando'],
    color: '#ef4444',
    icon: 'lucide:utensils',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'demo-subscriptions',
    name: 'Subscriptions',
    keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'apple'],
    color: '#8b5cf6',
    icon: 'lucide:repeat',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'demo-utilities',
    name: 'Utilities',
    keywords: ['british gas', 'ee', 'bt', 'vodafone', 'three', 'utility', 'water', 'electric', 'council tax'],
    color: '#64748b',
    icon: 'lucide:zap',
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 35).toISOString()
  },
  {
    id: 'demo-shopping',
    name: 'Shopping',
    keywords: ['amazon', 'h&m', 'next', 'zara', 'waterstones', 'argos'],
    color: '#ec4899',
    icon: 'lucide:shopping-bag',
    createdAt: new Date(Date.now() - 86400000 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 22).toISOString()
  },
  {
    id: 'demo-health',
    name: 'Health & Fitness',
    keywords: ['gym', 'boots', 'pharmacy', 'fitness', 'health'],
    color: '#06b6d4',
    icon: 'lucide:heart-pulse',
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 18).toISOString()
  },
  {
    id: 'demo-entertainment',
    name: 'Entertainment',
    keywords: ['cinema', 'odeon', 'vue', 'cineworld', 'ticket'],
    color: '#f97316',
    icon: 'lucide:ticket',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 12).toISOString()
  }
]

export default defineEventHandler(async () => {
  return demoRules
})
