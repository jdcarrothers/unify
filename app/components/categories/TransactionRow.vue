<script setup lang="ts">
import type { FinancialTransaction } from '~/types'

const props = defineProps<{
  transaction: FinancialTransaction
  categories: string[]
  hasOverride: boolean
}>()

const emit = defineEmits<{
  updateCategory: [newCategory: string]
}>()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}

function getSourceBadgeColor(source: string) {
  if (source === 'trading212') return 'success'
  if (source === 'credit-card') return 'error'
  return 'primary'
}

function getSourceLabel(source: string) {
  if (source === 'trading212') return 'T212'
  if (source === 'credit-card') return 'Card'
  return 'Bank'
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 p-3">
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <UBadge
        :color="getSourceBadgeColor(transaction.source)"
        variant="subtle"
        size="xs"
      >
        {{ getSourceLabel(transaction.source) }}
      </UBadge>
      <div class="flex-1 min-w-0">
        <p class="truncate font-medium">{{ transaction.description }}</p>
        <p class="text-xs text-gray-500">{{ formatDate(transaction.dateTime) }}</p>
      </div>
    </div>
    
    <div class="flex items-center gap-2 shrink-0">
      <UBadge :color="transaction.amount > 0 ? 'success' : 'error'" variant="subtle">
        {{ transaction.amount > 0 ? '+' : '' }}{{ formatCurrency(Math.abs(transaction.amount)) }}
      </UBadge>
      <UBadge
        v-if="hasOverride"
        color="warning"
        variant="subtle"
        size="xs"
      >
        M
      </UBadge>
      <USelectMenu
        :model-value="transaction.category"
        :items="categories"
        size="xs"
        class="w-36"
        @update:model-value="emit('updateCategory', $event as string)"
      />
    </div>
  </div>
</template>
