<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TradingConnect from '~/components/connections/TradingConnect.vue'
import TruelayerConnect from '~/components/connections/TruelayerConnect.vue'
import SyncBanner from '~/components/connections/SyncBanner.vue'
import { useConnections } from '~/composables/useConnections'

const showT212Modal = ref(false)
const showTLModal = ref(false)

const { getStatus } = useConnections()

const status = ref<any>(null)
const loading = ref(false)

async function refreshStatus() {
  loading.value = true
  try {
    status.value = await getStatus()
  } finally {
    loading.value = false
  }
}

onMounted(refreshStatus)

function handleTradingConnected() {
  refreshStatus()
}
function handleTrueLayerConnected() {
  refreshStatus()
}

const t212Connected = computed(() => !!status.value?.trading212?.connected)

const tl = computed(() => status.value?.truelayer ?? {})
const tlConnected = computed(() => !!tl.value?.connected)
const tlHasAccounts = computed(() => Array.isArray(tl.value?.connectedAccounts) && tl.value.connectedAccounts.length > 0)
const tlHasCards = computed(() => Array.isArray(tl.value?.connectedCards) && tl.value.connectedCards.length > 0)
const tlHasData = computed(() => tlHasAccounts.value || tlHasCards.value)

const tlPrimaryLabel = computed(() => {
  if (!tlConnected.value) return 'Connect'
  if (!tlHasData.value) return 'Initialise'
  return 'View accounts & cards'
})

</script>

<template>
  <UDashboardPanel id="connections">
    <template #header>
      <UDashboardNavbar title="Connections">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SyncBanner />

      <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- Trading212 -->
        <UPageCard title="Trading212" icon="i-lucide-line-chart" variant="subtle">
          <p class="text-sm text-muted mb-4">
            Connect your Trading212 account using your API credentials.
          </p>

          

          <UButton
            icon="i-lucide-key-round"
            color="primary"
            :label="t212Connected ? 'Update credentials' : 'Connect'"
            @click="showT212Modal = true"
          />
        </UPageCard>

        <!-- TrueLayer -->
        <UPageCard title="TrueLayer" icon="i-lucide-plug" variant="subtle">
          <p class="text-sm text-muted mb-4">
            Connect your debit & credit accounts via TrueLayer to import transactions.
          </p>


          <UButton
            :loading="loading"
            :label="tlPrimaryLabel"
            color="primary"
            icon="i-lucide-key-round"
            @click="showTLModal = true"
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
