<script setup lang="ts">
import type { Period, Range, Stat } from '~/types'
import type { CombinedFinancialData, FinancialTransaction } from '~/types'

const txList = computed<FinancialTransaction[]>(() => props.data?.transactions ?? [])
const totalBalance = computed(() => props.data?.totalBalance ?? 0)

const props = defineProps<{
  period: Period
  range: Range
  data: CombinedFinancialData
}>()

function formatCurrency(value: number): string {
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  })
}

function inRange(date: Date, range: Range) {
  return date >= range.start && date <= range.end
}

const MIRROR_TOLERANCE = 1 
const MIRROR_WINDOW_MS = 3 * 86400000 


function isMirrored(a: FinancialTransaction, b: FinancialTransaction) {
  const sameDay = Math.abs(
    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  ) < MIRROR_WINDOW_MS

  const amountsClose =
    Math.abs(Math.abs(a.amount) - Math.abs(b.amount)) < MIRROR_TOLERANCE

  const isBankToTrading =
    a.source === 'bank-account' && b.source === 'trading212' && sameDay && amountsClose

  const isTradingToBank =
    a.source === 'trading212' && b.source === 'bank-account' && sameDay && amountsClose

  return (
    (isBankToTrading && a.amount < 0 && b.amount > 0) ||
    (isTradingToBank && a.amount > 0 && b.amount < 0)
  )
}


const filteredTxs = computed(() => {
  const txs = [...txList.value]
  const toRemove = new Set<string>()

  for (const a of txs) {
    if (toRemove.has(a.reference)) continue

    const match = txs.find(
      (b) => !toRemove.has(b.reference) && a.reference !== b.reference && isMirrored(a, b)
    )

    if (match) {
      toRemove.add(a.reference)
      toRemove.add(match.reference)
    }
  }

  return txs.filter((t) => !toRemove.has(t.reference))
})


function sumTxs(filter: (tx: FinancialTransaction) => boolean) {
  return filteredTxs.value.reduce(
    (sum, tx) => (filter(tx) ? sum + Number(tx.amount) : sum),
    0
  )
}

const currentDeposits = computed(() =>
  sumTxs((tx) => {
    const d = new Date(tx.dateTime)
    return inRange(d, props.range) && tx.amount > 0 
  })
)

const currentWithdrawals = computed(() =>
  sumTxs((tx) => {
    const d = new Date(tx.dateTime)
    return inRange(d, props.range) && tx.amount < 0
  })
)

const currentInterest = computed(() =>
  sumTxs((tx) => {
    const d = new Date(tx.dateTime)
    return (
      inRange(d, props.range) &&
      tx.type == 'INTEREST/CASHBACK'
      
    )
  })
)

const stats = computed<Stat[]>(() => [
  {
    title: 'Current Balance',
    icon: 'i-lucide-wallet',
    value: formatCurrency(totalBalance.value),
    variation: 0,
  },
  {
    title: 'Incoming',
    icon: 'i-lucide-arrow-down-circle',
    value: formatCurrency(currentDeposits.value),
    variation: 0,
  },
  {
    title: 'Spent',
    icon: 'i-lucide-arrow-up-circle',
    value: formatCurrency(Math.abs(currentWithdrawals.value)),
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
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
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
