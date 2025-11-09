<script setup lang="ts">
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfDay,
  startOfWeek,
  startOfMonth,
  format,
  isWithinInterval,
} from 'date-fns'
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { Period, Range } from '~/types'
import type { CombinedFinancialData, FinancialTransaction } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const props = defineProps<{ period: Period; range: Range; data: CombinedFinancialData }>()

type DataRecord = { date: Date; balance: number }
const { width } = useElementSize(cardRef)

const txList = computed<FinancialTransaction[]>(() => props.data?.transactions ?? [])
const currentBalance = computed(() => props.data?.totalBalance ?? 0)

const bucketsFor = (period: Period, range: Range): Date[] => {
  const fns = {
    daily: eachDayOfInterval,
    weekly: (r: Range) => eachWeekOfInterval(r, { weekStartsOn: 1 }),
    monthly: eachMonthOfInterval,
  } as const
  return fns[period](range)
}

const bucketStart = (d: Date, period: Period) =>
  period === 'daily'
    ? startOfDay(d)
    : period === 'weekly'
    ? startOfWeek(d, { weekStartsOn: 1 })
    : startOfMonth(d)

const keyOf = (d: Date) => format(d, 'yyyy-MM-dd')

const dataSeries = ref<DataRecord[]>([])

watch([() => props.period, () => props.range, () => txList.value], () => {
  const txs = (txList.value ?? [])
    .map(t => ({ ...t, date: new Date(t.dateTime) }))
    .filter(t => isWithinInterval(t.date, props.range))
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const buckets = bucketsFor(props.period, props.range)
  if (!buckets.length) { dataSeries.value = []; return }

  const netByBucket = new Map<string, number>()
  for (const b of buckets) netByBucket.set(keyOf(b), 0)

  for (const tx of txs) {
    const k = keyOf(bucketStart(tx.date, props.period))
    const amt = Number(tx.amount)
    if (!Number.isFinite(amt)) continue
    netByBucket.set(k, (netByBucket.get(k) || 0) + amt)
  }

  const series: DataRecord[] = []
  let running = currentBalance.value
  for (const b of buckets.sort((a, b) => b.getTime() - a.getTime())) {
    running -= netByBucket.get(keyOf(b)) || 0
    series.unshift({ date: b, balance: running })
  }

  dataSeries.value = series
}, { immediate: true })

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.balance


const fmtMoney = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format
const fmtDate = (date: Date, p: Period) =>
  p === 'daily' ? format(date, 'd MMM') : p === 'weekly' ? format(date, 'd MMM') : format(date, 'MMM yyyy')

const xTicks = (i: number) =>
  (i === 0 || i === dataSeries.value.length - 1 || !dataSeries.value[i])
    ? ''
    : fmtDate(dataSeries.value[i].date, props.period)

const tooltip = (d: DataRecord) => `${fmtDate(d.date, props.period)}: ${fmtMoney(d.balance)}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">Balance Over Time</p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ fmtMoney(currentBalance) }}
        </p>
      </div>
    </template>

    <VisXYContainer :data="dataSeries" :padding="{ top: 40 }" class="h-96" :width="width">
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />
      <VisAxis type="x" :x="x" :tick-format="xTicks" />
      <VisCrosshair color="var(--ui-primary)" :template="tooltip" />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
