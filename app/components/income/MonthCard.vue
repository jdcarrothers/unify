<script setup lang="ts">
import type { MonthlyIncome } from '~/composables/useIncomeStats'

defineProps<{
  month: MonthlyIncome
}>()

const emit = defineEmits<{
  openBreakdown: []
}>()

function formatCurrency(value: number): string {
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  })
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
</script>

<template>
  <UCard :ui="{ body: 'space-y-3' }">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-muted uppercase">
          {{ month.month }}
        </h3>
        <p class="text-3xl font-bold text-highlighted mt-1">
          {{ formatCurrency(month.income) }}
        </p>
      </div>

      <UButton
        icon="i-lucide-maximize-2"
        variant="ghost"
        color="neutral"
        size="xs"
        @click="emit('openBreakdown')"
      />
    </div>

    <div
      v-if="month.change !== 0"
      class="flex items-center gap-1 text-sm"
      :class="month.change >= 0 ? 'text-success' : 'text-error'"
    >
      <UIcon
        :name="month.change >= 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
        class="text-xs"
      />
      <span>{{ formatChange(month.change) }} from previous</span>
    </div>
  </UCard>
</template>
