<script setup lang="ts">
import type { FinancialTransaction } from '~/types'
import CategoryCard from '~/components/categories/CategoryCard.vue'
import TransactionRow from '~/components/categories/TransactionRow.vue'
import { useDataProvider } from '~/composables/useDataProvider'

const { data: financeData, pending } = useDataProvider()
const { getRules, setTransactionCategory, getOverrides } = useCategorisation()

const {
  monthLabel,
  canNavigateForward,
  goToPreviousMonth,
  goToNextMonth,
  stats,
  reimbursements
} = useCategoryStats(financeData)

const categoryRules = ref<string[]>([])
const overrides = ref<Record<string, string>>({})

async function loadCategories() {
  const rules = await getRules()
  categoryRules.value = [
    'Uncategorized',
    ...rules.map(r => r.name)
  ]
}

async function loadOverrides() {
  overrides.value = await getOverrides()
}

const categories = computed(() => categoryRules.value)

const refreshKey = ref(0)
const selectedCategory = ref<string | null>(null)
const showCategoryModal = computed({
  get: () => selectedCategory.value !== null,
  set: (value: boolean) => {
    if (!value) selectedCategory.value = null
  }
})
const showReimbursementsModal = ref(false)

function selectCategory(categoryName: string) {
  selectedCategory.value = categoryName
}

function openReimbursements() {
  showReimbursementsModal.value = true
}

async function updateCategory(transaction: FinancialTransaction, newCategory: string) {
  await setTransactionCategory(transaction.reference, newCategory)
  transaction.category = newCategory
  await loadOverrides()
  refreshKey.value++
}

function hasOverride(ref: string): boolean {
  refreshKey.value // Trigger reactivity
  return ref in overrides.value
}

onMounted(() => {
  loadCategories()
  loadOverrides()
})

</script>

<template>
  <UDashboardPanel id="categories">
    <template #header>

      <UDashboardToolbar>
        <template #left>
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="goToPreviousMonth"
          />
          <UBadge color="neutral" variant="subtle" size="md" class="px-3">
            {{ monthLabel }}
          </UBadge>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="!canNavigateForward"
            @click="goToNextMonth"
          />
        </template>

        <template #right>
        <UButton
            label="Manage reimbursements"
            icon="i-lucide-dollar-sign"
            color="neutral"
            variant="outline"
            size="md"
            class="me-3"  
            @click="openReimbursements"  
            />
          <UButton
            label="Manage Rules"
            icon="i-lucide-settings"
            color="neutral"
            variant="outline"
            to="/rules"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UEmpty
        v-if="!pending && stats.length === 0"
        icon="i-lucide-pie-chart"
        title="No spending this month"
        description="Transactions will appear here once you start spending"
      />

      <div v-else class="pb-6">
        <UPageGrid class="lg:grid-cols-3">
          <CategoryCard
            v-for="category in stats"
            :key="category.categoryName"
            :category="category"
            @click="selectCategory(category.categoryName)"
          />
        </UPageGrid>

        <UModal
          v-model:open="showCategoryModal"
          :title="selectedCategory || 'Category Details'"
        >
          <template #body>
            <div v-if="selectedCategory" class="space-y-2">
              <TransactionRow
                v-for="tx in stats.find(s => s.categoryName === selectedCategory)?.transactions || []"
                :key="tx.reference"
                :transaction="tx"
                :categories="categories"
                :has-override="hasOverride(tx.reference)"
                @update-category="updateCategory(tx, $event)"
              />
            </div>
          </template>
        </UModal>

        <UModal
          v-model:open="showReimbursementsModal"
          title="Manage Reimbursements"
        >
          <template #body>
            <UEmpty
              v-if="reimbursements.length === 0"
              icon="i-lucide-arrow-down-circle"
              title="No reimbursements this month"
              description="Reimbursements will appear here when you receive deposits to categorize."
            />
            
            <div v-else class="space-y-2">
              <UAlert
                icon="i-lucide-info"
                color="primary"
                variant="soft"
                description="Assign reimbursements to categories to deduct them from spending totals"
                class="mb-4"
              />
              
              <TransactionRow
                v-for="tx in reimbursements"
                :key="tx.reference"
                :transaction="tx"
                :categories="categories"
                :has-override="hasOverride(tx.reference)"
                @update-category="updateCategory(tx, $event)"
              />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>