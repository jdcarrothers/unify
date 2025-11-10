<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { useFinanceStream } from '~/composables/useFinanceStream'
import { useDemoMode } from '~/composables/useDemoMode'

interface Props {
  syncOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  syncOnly: false
})

const { status: streamStatus } = useFinanceStream()
const { isDemoMode } = useDemoMode()

const syncing = ref(false)
const { data: status, refresh } = await useAsyncData('sync-status', () =>
  $fetch('/api/connections/status')
)

const lastSyncLabel = computed(() => {
  const iso = status.value?.lastSyncedAt
  if (!iso) return 'never'
  const dt = new Date(iso)
  return `${formatDistanceToNow(dt, { addSuffix: true })} (${dt.toLocaleString()})`
})

const isSyncing = computed(() => {
  return syncing.value || streamStatus.value?.state === 'pending'
})

const syncMessage = computed(() => {
  if (streamStatus.value?.state === 'pending') {
    return `${streamStatus.value.source} sync in progress`
  }
  return `Last synced: ${lastSyncLabel.value}`
})

const actions = computed(() => [
  {
    label: isSyncing.value ? 'Syncing...' : 'Force Sync',
    loading: isSyncing.value,
    disabled: isSyncing.value,
    size: 'sm' as const,
    color: 'primary' as const,
    variant: 'solid' as const,
    onClick: handleSync
  }
])

async function handleSync() {
  try {
    syncing.value = true
    await $fetch('/api/connections/sync', { method: 'POST' })
    await $fetch('/api/transactions')
    await refresh()
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <UAlert
    v-if="!isDemoMode && (!props.syncOnly || isSyncing)"
    :icon="isSyncing ? 'i-heroicons-arrow-path' : 'i-heroicons-clock'"
    :color="isSyncing ? 'warning' : 'neutral'"
    :title="isSyncing ? 'Syncing Data' : 'Data Status'"
    :description="syncMessage"
    :actions="actions"
    variant="outline"
    orientation="horizontal"
    class="mb-4 w-full min-w-0 min-h-12"
  />
</template>
