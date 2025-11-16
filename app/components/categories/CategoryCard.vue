<script setup lang="ts">
import type { CategoryStats } from '~/types/categorization'

defineProps<{
  category: CategoryStats
}>()

const emit = defineEmits<{
  click: []
}>()

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount)
}
</script>

<template>
  <UPageCard
    :title="category.categoryName"
    :icon="category.icon"
    class="cursor-pointer hover:shadow-md transition-shadow"
    @click="emit('click')"
  >
    <template #description>
      <div class="space-y-2 mt-2">
        <div class="text-2xl font-bold">
          {{ formatCurrency(category.totalAmount) }}
        </div>
        <div class="flex items-center justify-between text-sm">
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ category.transactionCount }} transaction{{ category.transactionCount !== 1 ? 's' : '' }}
          </UBadge>
          <span class="text-gray-500 pl-3">
            {{ category.percentage.toFixed(1) }}%
          </span>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
