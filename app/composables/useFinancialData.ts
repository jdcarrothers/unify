import { useFinanceStream } from '~/composables/useFinanceStream'
import { useDemoMode } from '~/composables/useDemoMode'
import type { CombinedFinancialData } from '~/types'

export function useFinancialData() {
  const { isDemoMode, toggleDemoMode: toggleDemo, setDemoMode } = useDemoMode()
  
  const fetchFinancialData = () => {
    const endpointUrl = computed(() => isDemoMode.value ? '/api/transactions/demo' : '/api/transactions')
    
    return useFetch<CombinedFinancialData>(endpointUrl, { 
      lazy: true,
      key: computed(() => `financial-data-${isDemoMode.value ? 'demo' : 'live'}`),
      server: false
    })
  }
  
  const useEnhancedFinanceStream = () => {
    const stream = useFinanceStream()
    
    const enhancedStatus = computed(() => {
      if (isDemoMode.value) {
        return null
      }
      return stream.status.value
    })
    
    const enhancedUpdate = computed(() => {
      if (isDemoMode.value) {
        return null
      }
      return stream.update.value
    })
    
    return {
      status: enhancedStatus,
      update: enhancedUpdate
    }
  }
  
  return {
    isDemoMode,
    setDemoMode,
    toggleDemoMode: toggleDemo,
    
    fetchFinancialData,
    useEnhancedFinanceStream
  }
}

export function useFinancialDataWithStream() {
  const { isDemoMode } = useDemoMode()
  
  const endpoint = ref('/api/transactions')
  const fetchKey = ref('financial-data-live')
  
  watchEffect(() => {
    if (isDemoMode.value) {
      endpoint.value = '/api/transactions/demo'
      fetchKey.value = `financial-data-demo-${Date.now()}`
    } else {
      endpoint.value = '/api/transactions'  
      fetchKey.value = `financial-data-live-${Date.now()}`
    }
  })
  
  const { data, status, refresh: originalRefresh, pending } = useFetch<CombinedFinancialData>(endpoint, {
    lazy: true,
    key: fetchKey,
    server: false, 
    default: () => ({ transactions: [], totalBalance: 0 })
  })
  
  const stream = useFinanceStream()
  
  const streamStatus = computed(() => {
    if (isDemoMode.value) {
      return null 
    }
    return stream.status.value
  })
  
  const streamUpdate = computed(() => {
    if (isDemoMode.value) {
      return null
    }
    return stream.update.value
  })
  
  const refresh = async () => {
    await originalRefresh()
  }
  
  return {
    data,
    status,
    refresh,
    streamStatus,
    streamUpdate,
    isDemoMode,
    pending
  }
}