<script setup lang="ts">
import type { Period, Range } from '~/types'
import { subYears } from 'date-fns'
import type {  FinancialTransaction } from '~/types'
import { useDataProvider } from '~/composables/useDataProvider'

const { data: financeData, status, refresh, streamUpdate, isDemoMode } = useDataProvider()

watch(streamUpdate, (evt) => {
  if (evt?.source === 'trading212') {
    console.info('[FinanceStream] Trading212 update received → refreshing finance data')
    refresh()
  }
})

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
      <UDashboardToolbar>
        <template #left>
          <HomeDateRangePicker v-model="range" class="-ms-1" />
          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <HomeStats :period="period" :range="range" :data="financeData!" />
        <HomeChart :period="period" :range="range" :data="financeData!" />
      </div>
    </template>
  </UDashboardPanel>
</template>
