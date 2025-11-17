<script setup lang="ts">
import { useFinanceStream } from '~/composables/useFinanceStream'
import { useDemoMode } from '~/composables/useDemoMode'

const { status: streamStatus } = useFinanceStream()
const { isDemoMode } = useDemoMode()

const isSyncing = computed(() => {
  return streamStatus.value?.state === 'pending' && streamStatus.value?.source === 'trading212'
})
</script>

<template>
  <UBadge
    v-if="!isDemoMode && isSyncing"
    color="warning"
    variant="subtle"
  >
    <Icon name="i-heroicons-arrow-path" class="animate-spin mr-1" />
    Syncing T212
  </UBadge>
</template>
