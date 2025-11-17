<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TradingConnect from '~/components/connections/TradingConnect.vue'
import TruelayerConnect from '~/components/connections/TruelayerConnect.vue'
import { useDemoMode } from '~/composables/useDemoMode'
import { useConnections } from '~/composables/useConnections'
import { useConnectionStatus, type ConnectionConfig } from '~/utils/shared'
import { useDemoConnectionData } from '~/composables/useDemoConnectionData'

const showT212Modal = ref(false)
const showTLModal = ref(false)

const { getStatus } = useConnections()
const { isDemoMode, setDemoMode } = useDemoMode()
const demoStatus = useDemoConnectionData()

const status = ref<any>(null)
const loading = ref(false)

async function refreshStatus() {
  loading.value = true
  try {
    // Use demo data if in demo mode, otherwise fetch from API
    status.value = isDemoMode.value 
      ? demoStatus 
      : { ...await getStatus(), demo: { active: false } }
  } finally {
    loading.value = false
  }
}

onMounted(refreshStatus)
watch(isDemoMode, refreshStatus)

function handleTradingConnected() {
  refreshStatus()
}
function handleTrueLayerConnected() {
  refreshStatus()
}

function handleConnectionClick(connectionId: string) {
  if (connectionId === 'trading212') {
    showT212Modal.value = true
  } else if (connectionId === 'truelayer') {
    showTLModal.value = true
  } else if (connectionId === 'demo') {
    // Toggle demo mode
    setDemoMode(!isDemoMode.value)
    refreshStatus()
  }
}

const connectionConfigs: ConnectionConfig[] = [
  {
    id: 'trading212',
    title: 'Trading212',
    icon: 'i-lucide-line-chart',
    description: 'Connect your Trading212 account using your API credentials.',
    statusPath: ['trading212', 'connected'],
    buttonLabel: {
      disconnected: 'Connect',
      connected: 'Update credentials'
    }
  },
  {
    id: 'truelayer',
    title: 'TrueLayer',
    icon: 'i-lucide-plug',
    description: 'Connect your debit & credit accounts via TrueLayer to import transactions.',
    statusPath: ['truelayer', 'connected'],
    hasDataPath: ['truelayer', 'connectedAccounts'], 
    buttonLabel: {
      disconnected: 'Connect',
      connected: 'Initialise',
      withData: 'View accounts & cards'
    }
  },
  {
    id: 'demo',
    title: 'Demo Mode',
    icon: 'i-heroicons-beaker',
    description: 'Switch between live financial data and mock demo data for testing.',
    statusPath: ['demo', 'active'], 
    buttonLabel: {
      disconnected: 'Start Demo',
      connected: 'Stop Demo'
    }
  }
]

const connectionStatuses = computed(() => {
  const statuses = useConnectionStatus(status.value, connectionConfigs)
  
  const truelayerStatus = statuses.find(s => s.id === 'truelayer')
  if (truelayerStatus && status.value?.truelayer) {
    const hasAccounts = Array.isArray(status.value.truelayer.connectedAccounts) && 
                       status.value.truelayer.connectedAccounts.length > 0
    const hasCards = Array.isArray(status.value.truelayer.connectedCards) && 
                    status.value.truelayer.connectedCards.length > 0
    truelayerStatus.hasData = hasAccounts || hasCards
    
    if (truelayerStatus.isConnected) {
      truelayerStatus.buttonLabel = truelayerStatus.hasData ? 
        'View accounts & cards' : 'Initialise'
    }
  }
  
  return statuses
})

</script>

<template>
  <UDashboardPanel id="connections">

    <template #body>
      <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6">
        <UPageCard 
          v-for="connection in connectionStatuses" 
          :key="connection.id"
          :title="connection.title" 
          :icon="connection.icon" 
          variant="subtle"
        >
          <p class="text-sm text-muted mb-4">
            {{ connection.description }}
          </p>

          <UButton
            :loading="loading"
            :label="connection.buttonLabel"
            color="primary"
            :icon="connection.id === 'demo' ? 'i-heroicons-beaker' : 'i-lucide-key-round'"
            @click="handleConnectionClick(connection.id)"
          />
        </UPageCard>
      </UPageGrid>

      <TradingConnect
        v-model:show="showT212Modal"
        @connected="handleTradingConnected"
      />

      <TruelayerConnect
        v-model:show="showTLModal"
        :truelayer="status?.truelayer"
        @connected="handleTrueLayerConnected"
      />
    </template>
  </UDashboardPanel>
</template>
