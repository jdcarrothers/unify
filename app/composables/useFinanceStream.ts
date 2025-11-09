import { ref, onMounted, onBeforeUnmount } from 'vue'

interface StatusPayload {
  source: string
  state: 'pending' | 'error' | 'ready'
  error?: string
}

interface UpdatePayload {
  source: string
  data?: unknown
}

export function useFinanceStream() {
  const status = ref<StatusPayload | null>(null)
  const update = ref<UpdatePayload | null>(null)
  let eventSource: EventSource | null = null

  onMounted(() => {
    eventSource = new EventSource('/api/transactions/stream')

    eventSource.addEventListener('status', (e) => {
      try {
        status.value = JSON.parse((e as MessageEvent).data)
      } catch (err) {
        console.error('Invalid SSE status payload:', err)
      }
    })

    eventSource.addEventListener('update', (e) => {
      try {
        update.value = JSON.parse((e as MessageEvent).data)
      } catch (err) {
        console.error('Invalid SSE update payload:', err)
      }
    })

    eventSource.addEventListener('ping', () => {
    })

    eventSource.onerror = (err) => {
      console.warn('Finance stream disconnected:', err)
      status.value = { source: 'system', state: 'error', error: 'Stream disconnected' }
    }
  })

  onBeforeUnmount(() => {
    eventSource?.close()
    eventSource = null
  })

  return { status, update }
}
