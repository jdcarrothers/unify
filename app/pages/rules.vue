<script setup lang="ts">
import type { CategoryRule } from '~/types/categorization'
import RuleFormModal from '~/components/categories/RuleFormModal.vue'

const { getRules, deleteRule } = useCategorisation()

const rules = ref<CategoryRule[]>([])
const showFormModal = ref(false)
const editingRule = ref<CategoryRule | null>(null)

function loadRules() {
  rules.value = getRules()
}

function openCreateForm() {
  editingRule.value = null
  showFormModal.value = true
}

function openEditForm(rule: CategoryRule) {
  editingRule.value = rule
  showFormModal.value = true
}

function handleSaved() {
  loadRules()
}

function handleDelete(id: string) {
  if (confirm('Delete this category rule?')) {
    deleteRule(id)
    loadRules()
  }
}

onMounted(() => {
  loadRules()
})
</script>

<template>
  <UDashboardPanel id="rules">
    <template #header>
      <UDashboardNavbar title="Category Rules">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UEmpty
        v-if="rules.length === 0"
        icon="i-lucide-tag"
        title="No category rules yet"
        description="Create your first rule to start categorizing transactions automatically."
      >
        <template #actions>
          <UButton
            icon="i-lucide-plus"
            label="Create Rule"
            color="primary"
            @click="openCreateForm"
          />
        </template>
      </UEmpty>

      <div v-else class="space-y-6">
        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="soft"
          title="How Category Rules Work"
          description="Rules automatically categorize transactions based on keywords in their descriptions. Click any rule card to edit it, or create a new one below."
        >
          <template #actions>
            <UButton
              icon="i-lucide-plus"
              label="New Rule"
              color="primary"
              size="sm"
              @click="openCreateForm"
            />
          </template>
        </UAlert>

        <UPageGrid class="lg:grid-cols-3">
          <UPageCard
            v-for="rule in rules"
            :key="rule.id"
            :title="rule.name"
            :icon="rule.icon"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="openEditForm(rule)"
          >
            <template #description>
              <div class="flex flex-wrap gap-1 mt-2">
                <UBadge
                  v-for="keyword in rule.keywords.slice(0, 3)"
                  :key="keyword"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  {{ keyword }}
                </UBadge>
                <UBadge
                  v-if="rule.keywords.length > 3"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  +{{ rule.keywords.length - 3 }} more
                </UBadge>
              </div>
            </template>

            <template #actions>
              <UDropdownMenu
                :items="[[
                  { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEditForm(rule) },
                  { label: 'Delete', icon: 'i-lucide-trash-2', onSelect: () => handleDelete(rule.id), color: 'error' as const }
                ]]"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  color="neutral"
                  variant="ghost"
                  @click.stop
                />
              </UDropdownMenu>
            </template>
          </UPageCard>
        </UPageGrid>
      </div>

      <RuleFormModal
        v-model:show="showFormModal"
        :rule="editingRule"
        @saved="handleSaved"
      />
    </template>
  </UDashboardPanel>
</template>
