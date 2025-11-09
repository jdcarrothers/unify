<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'

type Status = { lastSyncedAt: string | null }

const syncing = ref(false)
const { data: status, refresh } = await useAsyncData<Status>('sync-status', () =>
  $fetch('/api/connections/status')
)

const lastSyncLabel = computed(() => {
  const iso = status.value?.lastSyncedAt
  if (!iso) return 'never'
  const dt = new Date(iso)
  return `${formatDistanceToNow(dt, { addSuffix: true })} (${dt.toLocaleString()})`
})

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
    variant="soft"
    title="Data"
    :description="`Last synced: ${lastSyncLabel}`"
    class="mb-3"
  >
    <template #actions>
      <UButton :loading="syncing" size="sm" @click="handleSync">
        Sync
      </UButton>
    </template>
  </UAlert>
</template>
