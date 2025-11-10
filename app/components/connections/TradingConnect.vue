<script setup lang="ts">
import { ref } from 'vue'
import { useConnections } from '~/composables/useConnections'
import { useDemoMode } from '~/composables/useDemoMode'

const show = defineModel<boolean>('show', { required: true })
const emit = defineEmits(['connected'])

const { isDemoMode } = useDemoMode()

const t212Key = ref('')
const t212Secret = ref('')

async function connectTrading212(close: () => void) {
  if (isDemoMode.value) {
    console.log('Demo mode: Simulating Trading212 connection')
    close()
    emit('connected')
    return
  }

  const { connectTrading } = useConnections()
  try{
    await connectTrading(t212Key.value, t212Secret.value)
    await $fetch('/api/connections/sync', { method: 'POST' })
    close()
    emit('connected')
  } catch (error) {
    console.error('Error connecting to Trading212:', error)
  }
}
</script>

<template>
  <UModal v-model:open="show" title="Connect Trading212 Account" :ui="{ footer: 'justify-end' }">
    <template #body>
      <UAlert
        v-if="isDemoMode"
        icon="i-heroicons-information-circle"
        color="info"
        variant="soft"
        title="Demo Mode"
        description="Not available in demo mode"
        class="mb-4"
      />

      <div class="flex flex-row gap-10">
        <UFormField label="API Key" required>
          <UInput
            v-model="t212Key"
            placeholder="Trading212 API Key"
            type="text"
            :disabled="isDemoMode"
            required
          />
        </UFormField>

        <UFormField label="API Secret" required>
          <UInput
            v-model="t212Secret"
            placeholder="Trading212 API Secret"
            type="password"
            :disabled="isDemoMode"
            required
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
      <UButton 
        label="Connect" 
        color="primary" 
        :disabled="isDemoMode"
        @click="connectTrading212(close)" 
      />
    </template>
  </UModal>
</template>
