<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '#imports'
import { useConnections } from '~/composables/useConnections'
import { useDemoMode } from '~/composables/useDemoMode'
import { useDemoConnectionData } from '~/composables/useDemoConnectionData'

type TLStatus = {
  connected?: boolean
  connectedAccounts?: Array<any>
  connectedCards?: Array<any>
}

const show = defineModel<boolean>('show', { required: true })
const props = defineProps<{ truelayer?: TLStatus | null }>()
const emit = defineEmits<{
  (e: 'connected'): void
}>()

const { connectTrueLayer, initTrueLayer } = useConnections()
const { isDemoMode } = useDemoMode()
const demoConnectionData = useDemoConnectionData()
const toast = useToast()

const tl = computed(() => {
  if (isDemoMode.value) {
    return demoConnectionData.truelayer
  }
  return props.truelayer ?? {}
})

const isConnected = computed(() => !!tl.value?.connected)
const hasAccounts = computed(() => Array.isArray(tl.value?.connectedAccounts) && tl.value.connectedAccounts.length > 0)
const hasCards = computed(() => Array.isArray(tl.value?.connectedCards) && tl.value.connectedCards.length > 0)
const hasData = computed(() => hasAccounts.value || hasCards.value)

async function onConnect(close: () => void) {
  if (isDemoMode.value) {
    close()
    emit('connected')
    return
  }

  try {
    await connectTrueLayer() 
    close()
  } catch (err: any) {
    toast.add({
      title: 'TrueLayer connect failed',
      description: err?.data?.message || err?.message,
      color: 'error',
    })
  }
}

async function onInitialise(close?: () => void) {
  try {
    await initTrueLayer()
    emit('connected') 
    close?.()
  } catch (err: any) {
    toast.add({
      title: 'Initialisation failed',
      description: err?.data?.message || err?.message,
      color: 'error',
    })
  }
}

async function onResync() {
  await onInitialise()
}
</script>

<template>
  <UModal
    v-model:open="show"
    title="TrueLayer — Cards & Accounts"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="!isConnected" class="space-y-4">
        <p class="text-sm text-muted">
          Connect via TrueLayer to import card and bank transactions.
        </p>
        <UAlert
          icon="i-lucide-info"
          color="neutral"
          variant="subtle"
          title="You’ll be redirected to TrueLayer to approve access."
        />
      </div>

      <div v-else-if="isConnected && !hasData" class="space-y-2">
        <p class="text-sm text-muted">
          TrueLayer is connected. Initialise to pull your accounts/cards and balances.
        </p>
      </div>

      <div v-else class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-muted mb-2">Bank accounts</h3>
          <div v-if="hasAccounts" class="space-y-2">
            <div
              v-for="acc in tl.connectedAccounts"
              :key="acc.account_id"
              class="flex items-center justify-between rounded-lg border border-divider p-3"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="acc.provider?.logo_uri"
                  :src="acc.provider.logo_uri"
                  alt=""
                  class="h-6 w-6 rounded"
                />
                <div>
                  <div class="font-medium">{{ acc.display_name }}</div>
                  <div class="text-xs text-muted">
                    {{ acc.currency }} • {{ acc.account_type }}
                  </div>
                </div>
              </div>
              <div class="text-sm font-medium">
                {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: acc.currency || 'GBP' })
                    .format(acc.balance ?? 0) }}
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-muted">No accounts.</div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-muted mb-2">Cards</h3>
          <div v-if="hasCards" class="space-y-2">
            <div
              v-for="card in tl.connectedCards"
              :key="card.account_id"
              class="flex items-center justify-between rounded-lg border border-divider p-3"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="card.provider?.logo_uri"
                  :src="card.provider.logo_uri"
                  alt=""
                  class="h-6 w-6 rounded"
                />
                <div>
                  <div class="font-medium">{{ card.display_name }}</div>
                  <div class="text-xs text-muted">
                    {{ card.card_network }} • {{ card.card_type }}
                    <template v-if="card.partial_card_number"> • **** {{ card.partial_card_number }}</template>
                  </div>
                </div>
              </div>
              <div class="text-sm font-medium">
                -{{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: card.currency || 'GBP' })
                    .format(card.balance ?? 0) }}
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-muted">No cards.</div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Close" color="neutral" variant="outline" @click="close" />

      <UButton
        v-if="!isConnected"
        label="Connect with TrueLayer"
        color="primary"
        @click="onConnect(close)"
      />
      <UButton
        v-else-if="isConnected && !hasData"
        label="Initialise"
        color="primary"
        @click="onInitialise(close)"
      />
      <UButton
        v-else
        label="Re-sync"
        color="primary"
        icon="i-lucide-refresh-ccw"
        @click="onResync"
      />
    </template>
  </UModal>
</template>
