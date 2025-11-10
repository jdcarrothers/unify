const globalDemoMode = ref(false)
let isInitialized = false

const DEMO_MODE_KEY = 'unify-demo-mode'

function initializeDemoMode() {
  if (isInitialized || typeof window === 'undefined') return
  
  const stored = localStorage.getItem(DEMO_MODE_KEY)
  globalDemoMode.value = stored === 'true'
  isInitialized = true
}

function saveDemoMode(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_MODE_KEY, String(enabled))
  globalDemoMode.value = enabled
}

export function useDemoMode() {
  if (process.client && !isInitialized) {
    initializeDemoMode()
  }
  
  const isDemoMode = readonly(globalDemoMode)
  
  const toggleDemoMode = () => {
    const newValue = !globalDemoMode.value
    console.log('Toggling demo mode:', globalDemoMode.value, '->', newValue)
    saveDemoMode(newValue)
    console.log('Demo mode after toggle:', globalDemoMode.value)
  }
  
  const setDemoMode = (enabled: boolean) => {
    saveDemoMode(enabled)
  }
  
  return {
    isDemoMode,
    toggleDemoMode,
    setDemoMode
  }
}