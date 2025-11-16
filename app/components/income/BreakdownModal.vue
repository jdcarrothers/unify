<script setup lang="ts">
import type { MonthlyIncome, IncomeBreakdown } from '~/composables/useIncomeStats'

defineProps<{
  month: MonthlyIncome | null
  breakdown: IncomeBreakdown | null
}>()

const show = defineModel<boolean>('show', { required: true })

function formatCurrency(value: number): string {
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
</script>

<template>
  <UModal
    v-model:open="show"
    :title="month ? `${month.month} Income Breakdown` : 'Income Breakdown'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="month && breakdown" class="space-y-4">
        <!-- Salary Section -->
        <div v-if="breakdown.salary > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-medium">Salary</span>
            <span class="font-semibold text-green-600 dark:text-green-400">
              {{ formatCurrency(breakdown.salary) }}
            </span>
          </div>
          <div class="pl-6 space-y-1">
            <div
              v-for="tx in breakdown.salaryTxs"
              :key="tx.reference"
              class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
            >
              <span>{{ formatDate(tx.dateTime) }} - {{ tx.description }}</span>
              <span>{{ formatCurrency(tx.amount) }}</span>
            </div>
          </div>
        </div>

        <USeparator v-if="breakdown.salary > 0" />

        <!-- Interest Section -->
        <div v-if="breakdown.interestTotal > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-medium">Interest + Cashback</span>
              <UBadge size="xs" color="primary" variant="subtle">
                {{ breakdown.interestCount }} payments
              </UBadge>
            </div>
            <span class="font-semibold text-green-600 dark:text-green-400">
              {{ formatCurrency(breakdown.interestTotal) }}
            </span>
          </div>
        </div>

        <USeparator v-if="breakdown.interestTotal > 0" />

        <!-- Other Section -->
        <div v-if="breakdown.other > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-medium">Other</span>
            <span class="font-semibold text-green-600 dark:text-green-400">
              {{ formatCurrency(breakdown.other) }}
            </span>
          </div>
          <div class="pl-6 space-y-1">
            <div
              v-for="tx in breakdown.otherTxs"
              :key="tx.reference"
              class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
            >
              <span>{{ formatDate(tx.dateTime) }} - {{ tx.description }}</span>
              <span>{{ formatCurrency(tx.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div v-if="month" class="flex items-center justify-between pt-2">
        <span class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ formatCurrency(month.income) }}
        </span>
      </div>
    </template>
  </UModal>
</template>
