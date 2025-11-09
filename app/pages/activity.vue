<script setup lang="ts">
import { h, ref, computed, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import type { CombinedFinancialData, FinancialTransaction, Stat } from '~/types'
import { useFinanceStream } from '~/composables/useFinanceStream'

const { data, status, refresh } = await useFetch<CombinedFinancialData>('/api/transactions', { lazy: true })
const { status: streamStatus, update: streamUpdate } = useFinanceStream()

watch(streamUpdate, (evt) => {
  if (evt?.source === 'trading212') refresh()
})

const isT212Syncing = computed(() => streamStatus.value?.source === 'trading212' && streamStatus.value.state === 'pending')
const t212Error = computed(() => streamStatus.value?.state === 'error' ? streamStatus.value.error : null)

const MIRROR_TOLERANCE = 1
const MIRROR_WINDOW_MS = 3 * 86400000

function isMirrored(bankTx: FinancialTransaction, t212Tx: FinancialTransaction) {
  return (
    bankTx.source === 'bank-account' &&
    bankTx.amount < 0 &&
    t212Tx.source === 'trading212' &&
    t212Tx.amount > 0 &&
    Math.abs(Math.abs(bankTx.amount) - Math.abs(t212Tx.amount)) < MIRROR_TOLERANCE &&
    Math.abs(new Date(bankTx.dateTime).getTime() - new Date(t212Tx.dateTime).getTime()) <
      MIRROR_WINDOW_MS
  )
}

const filteredTransactions = computed(() => {
  const txs = [...(data.value?.transactions || [])]
  const toRemove = new Set<string>()

  for (const bankTx of txs.filter((t) => t.source === 'bank-account' && t.amount < 0)) {
    const match = txs.find((t) => !toRemove.has(t.reference) && isMirrored(bankTx, t))
    if (match) {
      toRemove.add(bankTx.reference)
      toRemove.add(match.reference)
    }
  }

  return txs.filter((t) => !toRemove.has(t.reference))
})

const monthOffset = ref(0)
const weekOffset = ref(0)

function shiftMonth(delta: number) {
  const now = new Date()
  const newOffset = monthOffset.value + delta
  const target = new Date(now)
  target.setMonth(now.getMonth() + newOffset)
  if (target > now) return 
  monthOffset.value = newOffset
}

function shiftWeek(delta: number) {
  const now = new Date()
  const newOffset = weekOffset.value + delta
  const target = new Date(now)
  target.setDate(now.getDate() + newOffset * 7)
  if (target > now) return 
  weekOffset.value = newOffset
}

function getRange(mode: 'month' | 'week', offset: number) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (mode === 'month') {
    start.setMonth(now.getMonth() + offset)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(now.getMonth() + offset + 1)
    end.setDate(0)
    end.setHours(23, 59, 59, 999)
  } else {
    const currentDay = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - currentDay + offset * 7)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    start.setTime(startOfWeek.getTime())
    end.setTime(endOfWeek.getTime())
  }

  return { start, end }
}

function formatRangeLabel(mode: 'month' | 'week', start: Date, end: Date) {
  return mode === 'month'
    ? start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

function calcSpending(range: { start: Date; end: Date }) {
  let total = 0
  for (const tx of filteredTransactions.value) {
    if (tx.amount < 0 && tx.type !== 'DEPOSIT') {
      const d = new Date(tx.dateTime)
      if (d >= range.start && d <= range.end) total += Math.abs(tx.amount)
    }
  }
  return total
}

const monthRange = computed(() => getRange('month', monthOffset.value))
const weekRange = computed(() => getRange('week', weekOffset.value))

const monthSpending = computed(() => calcSpending(monthRange.value))
const weekSpending = computed(() => calcSpending(weekRange.value))

const monthLabel = computed(() => formatRangeLabel('month', monthRange.value.start, monthRange.value.end))
const weekLabel = computed(() => formatRangeLabel('week', weekRange.value.start, weekRange.value.end))

const stats = computed((): Stat[] => [
  {
    key: 'month',
    icon: 'i-lucide-calendar-range',
    title: 'Monthly Spending',
    value: monthSpending.value.toFixed(2),
    variation: 0,
    label: monthLabel.value,
  },
  {
    key: 'week',
    icon: 'i-lucide-calendar-days',
    title: 'Weekly Spending',
    value: weekSpending.value.toFixed(2),
    variation: 0,
    label: weekLabel.value,
  },
])


type TxRow = FinancialTransaction & {
  uid: string
  dayKey: string
  dayLabel: string
}

const fmtGBP = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
const typeColor = (t: string) =>
  ({ DEPOSIT: 'success', WITHDRAW: 'error', DIVIDEND: 'primary', FEE: 'warning' } as Record<string, string>)[t] || 'neutral'

const rows = computed<TxRow[]>(() => {
  if (!data.value?.transactions) return []
  const out = data.value.transactions.map((t) => {
    const d = new Date(t.dateTime)
    const dayKey = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
    const dayLabel = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    const uid = `${t.dateTime}|${t.type}|${t.amount}`
    return { ...t, uid, dayKey, dayLabel }
  })
  return out.sort((a, b) => {
    if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? 1 : -1
    return new Date(a.dateTime).getTime() < new Date(b.dateTime).getTime() ? 1 : -1
  })
})

const columns: TableColumn<TxRow>[] = [
  { id: 'title', header: 'Date' },
  { id: 'day', accessorKey: 'dayKey' },
  {
    accessorKey: 'amount',
    header: () => h('div', { class: 'text-right' }, 'Amount'),
    cell: ({ row }) => {
      const amount = Number.parseFloat(String(row.getValue('amount')))
      const isGroup = row.getIsGrouped()
      return h(
        'div',
        { class: ['font-medium', isGroup ? 'text-right' : 'text-left', amount >= 0 ? 'text-success' : 'text-error'] },
        `${amount >= 0 ? '+' : ''}${fmtGBP(Math.abs(amount))}`
      )
    },
    aggregationFn: 'sum'
  }
]

const grouping = ref<string[]>(['day'])
const groupingOptions = ref<GroupingOptions>({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel()
})

type SelectedGroup = { dayKey: string } | null
const selectedGroup = ref<SelectedGroup>(null)

function selectFromRow(rowObj: any) {
  if (rowObj.getIsGrouped() && rowObj.groupingColumnId === 'day') {
    selectedGroup.value = { dayKey: rowObj.original.dayKey }
  } else {
    const o = rowObj.original as TxRow
    selectedGroup.value = { dayKey: o.dayKey }
  }
}

function isRowHighlighted(rowObj: any) {
  const sel = selectedGroup.value
  if (!sel) return false
  if (rowObj.getIsGrouped && rowObj.getIsGrouped()) return rowObj.original.dayKey === sel.dayKey
  const o = rowObj.original as TxRow
  return o && o.dayKey === sel.dayKey
}

function rowAttrs(rowObj: any) {
  const highlighted = isRowHighlighted(rowObj)
  return {
    class: ['cursor-pointer transition-colors', 'hover:bg-primary/5', highlighted ? 'bg-primary/10 ring-1 ring-inset ring-primary/25' : ''].join(' '),
    onClick: () => selectFromRow(rowObj),
    'aria-selected': highlighted || undefined
  }
}
</script>

<template>
  <UDashboardPanel id="activity-grouped">
    <template #header>
      <UDashboardNavbar title="Transaction Activity">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge v-if="isT212Syncing" color="warning" variant="subtle">
            Trading212 syncing…
          </UBadge>
          <UBadge v-else-if="t212Error" color="error" variant="subtle">
            {{ t212Error }}
          </UBadge>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid class="lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-px items-center">
        <UPageCard
          v-for="stat in stats"
          :key="stat.key"
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
          <div class="flex items-center justify-between">
            <UButton
              icon="i-lucide-chevron-left"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="stat.key === 'month' ? shiftMonth(-1) : shiftWeek(-1)"
            />
            <div class="flex flex-col items-center">
              <span class="text-2xl font-semibold text-highlighted">-{{ stat.value }}</span>
              <span class="text-xs text-muted">{{ stat.label }}</span>
            </div>
            <UButton
              icon="i-lucide-chevron-right"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="stat.key === 'month' ? shiftMonth(1) : shiftWeek(1)"
            />
          </div>
        </UPageCard>
      </UPageGrid>

      <UCard :ui="{ body: 'p-0' }" class="overflow-hidden">
        <div class="overflow-auto max-h-[60vh]">
          <UTable
            :data="rows"
            :columns="columns"
            :grouping="grouping"
            :grouping-options="groupingOptions"
            row-key="uid"
            :row-attrs="rowAttrs"
            :ui="{ root: 'min-w-full', tr: 'align-middle', td: 'empty:p-0' }"
          >
            <template #title-cell="{ row }">
              <div class="flex items-center">
                <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />
                <UButton
                  v-if="row.getIsGrouped() && row.getCanExpand()"
                  variant="outline"
                  color="neutral"
                  size="xs"
                  class="mr-2"
                  :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                  @click.stop="row.toggleExpanded()"
                />
                <template v-if="row.getIsGrouped()">
                  <strong>{{ row.original.dayLabel }}</strong>
                </template>
                <template v-else>
                  <UBadge
                    :color="typeColor(row.original.type) as any"
                    class="capitalize"
                    variant="subtle"
                  >
                    {{ row.original.type.toLowerCase() }}
                  </UBadge>

                  <p class="ml-2 text-sm text-muted">
                  {{ row.original.source }}
                  </p>
                </template>
              </div>
            </template>
          </UTable>
        </div>

        <div v-if="status === 'pending'" class="flex items-center justify-center py-10">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-muted" />
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
