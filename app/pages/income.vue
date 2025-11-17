<script setup lang="ts">
import type { MonthlyIncome } from '~/composables/useIncomeStats'
import MonthCard from '~/components/income/MonthCard.vue'
import BreakdownModal from '~/components/income/BreakdownModal.vue'

const { data } = useDataProvider()

const { monthlyIncomes, getBreakdown } = useIncomeStats(data)

const selectedMonth = ref<MonthlyIncome | null>(null)
const showModal = ref(false)

function openBreakdown(month: MonthlyIncome) {
  selectedMonth.value = month
  showModal.value = true
}

const breakdown = computed(() =>
  selectedMonth.value ? getBreakdown(selectedMonth.value.transactions) : null
)
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MonthCard
          v-for="month in monthlyIncomes"
          :key="month.month"
          :month="month"
          @open-breakdown="openBreakdown(month)"
        />
      </div>

      <BreakdownModal
        v-model:show="showModal"
        :month="selectedMonth"
        :breakdown="breakdown"
      />
    </template>
  </UDashboardPanel>
</template>
