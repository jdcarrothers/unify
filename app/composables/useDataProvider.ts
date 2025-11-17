import { useDemoMode } from '~/composables/useDemoMode'
import { useFinanceStream } from '~/composables/useFinanceStream'
import type { CombinedFinancialData } from '~/types'

/**
 * Central abstraction layer for all financial data fetching.
 * Automatically handles demo vs live mode switching without conditional logic scattered across components.
 * 
 * In demo mode:
 * - Uses preloaded /api/transactions/demo endpoint
 * - Bypasses SSE streaming
 * - Returns mock data instantly
 * 
 * In live mode:
 * - Uses real /api/transactions endpoint
 * - Enables SSE streaming for real-time updates
 * - Fetches actual financial data from APIs
 */
export function useDataProvider() {
  const { isDemoMode } = useDemoMode()
  
  // Reactive endpoint and cache key based on demo mode
  const endpoint = computed(() => 
    isDemoMode.value ? '/api/transactions/demo' : '/api/transactions'
  )
  
  const cacheKey = computed(() => 
    `financial-data-${isDemoMode.value ? 'demo' : 'live'}-${Date.now()}`
  )
  
  // Fetch financial data with automatic demo/live switching
  const { data, status, refresh: originalRefresh, pending } = useFetch<CombinedFinancialData>(
    endpoint,
    {
      lazy: true,
      key: cacheKey,
      server: false,
      default: () => ({ transactions: [], totalBalance: 0 }),
      watch: false // Prevent auto-refetch on endpoint change
    }
  )
  
  // SSE stream (only active in live mode)
  const stream = useFinanceStream()
  
  // Stream status - null in demo mode, live updates otherwise
  const streamStatus = computed(() => 
    isDemoMode.value ? null : stream.status.value
  )
  
  // Stream updates - null in demo mode, live updates otherwise
  const streamUpdate = computed(() => 
    isDemoMode.value ? null : stream.update.value
  )
  
  // Enhanced refresh that works in both modes
  const refresh = async () => {
    await originalRefresh()
  }
  
  // Watch demo mode changes and refresh data
  watch(isDemoMode, async () => {
    await refresh()
  })
  
  return {
    // Data
    data,
    status,
    pending,
    
    // Actions
    refresh,
    
    // Stream (auto-disabled in demo mode)
    streamStatus,
    streamUpdate,
    
    // Mode indicator
    isDemoMode: readonly(isDemoMode)
  }
}
