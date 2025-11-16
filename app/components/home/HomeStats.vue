<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'
import type { CombinedFinancialData } from '~/types'
import { 
  filterMirroredTransactions,
  calculateIncome,
  calculateSpending
} from '~/composables/useActivityStats'

const props = defineProps<{
  period: Period
  range: Range
  data: CombinedFinancialData
}>()

const filteredTxs = computed(() => {
  const transactions = props.data?.transactions || []
  return filterMirroredTransactions(transactions)
})

const totalBalance = computed(() => props.data?.totalBalance ?? 0)

function formatCurrency(value: number): string {
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  })
}

function inRange(date: Date) {
  return date >= props.range.start && date <= props.range.end
}

const currentSpending = computed(() => 
  calculateSpending(filteredTxs.value, props.range)
)

const currentInterest = computed(() =>
  filteredTxs.value
    .filter(tx => {
      const d = new Date(tx.dateTime)
      return inRange(d) && tx.type === 'INTEREST/CASHBACK'
    })
    .reduce((sum, tx) => sum + tx.amount, 0)
)

const stats = computed<Stat[]>(() => [
  {
    title: 'Current Balance',
    icon: 'i-lucide-wallet',
    value: formatCurrency(totalBalance.value),
    variation: 0,
  },
  {
    title: 'Spent',
    icon: 'i-lucide-arrow-up-circle',
    value: formatCurrency(currentSpending.value),
    variation: 0,
  },
  {
    title: 'Interest + Cashback',
    icon: 'i-lucide-piggy-bank',
    value: formatCurrency(currentInterest.value),
    variation: 0,
  },
])
</script>

<template>
  <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>