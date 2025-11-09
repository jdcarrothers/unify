<script setup lang="ts">
import type { Period, Range } from '~/types'
import { subYears } from 'date-fns'
import type { CombinedFinancialData, FinancialTransaction } from '~/types'
import { useFinanceStream } from '~/composables/useFinanceStream'

const { data: financeData, status, refresh } = await useFetch<CombinedFinancialData>(
  '/api/transactions',
  { lazy: true }
)

const { status: streamStatus, update: streamUpdate } = useFinanceStream()

watch(streamUpdate, (evt) => {
  if (evt?.source === 'trading212') {
    console.info('[FinanceStream] Trading212 update received → refreshing finance data')
    refresh()
  }
})
  
const isT212Syncing = computed(() => streamStatus.value?.source === 'trading212' && streamStatus.value.state === 'pending')
const t212Error = computed(() => streamStatus.value?.state === 'error' ? streamStatus.value.error : null)

const earliestTxDate = computed(() => {
  const all = financeData.value?.transactions ?? []
  if (!all.length) {
    return subYears(new Date(), 1)
  }
  return new Date(Math.min(...all.map((t: FinancialTransaction) => new Date(t.dateTime).getTime())))
})

const range = shallowRef<Range>({
  start: earliestTxDate.value,
  end: new Date(),
})

watch(earliestTxDate, (newEarliest) => {
  range.value = { ...range.value, start: newEarliest }
})

const period = ref<Period>('weekly')

</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge v-if="isT212Syncing" color="warning" variant="subtle">
            Trading212 syncing...
          </UBadge>
          <UBadge v-else-if="t212Error" color="error" variant="subtle">
            {{ t212Error }}
          </UBadge>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <HomeDateRangePicker v-model="range" class="-ms-1" />
          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <HomeStats :period="period" :range="range" :data="financeData!" />
      <HomeChart :period="period" :range="range" :data="financeData!" />
    </template>
  </UDashboardPanel>
</template>
