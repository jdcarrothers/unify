<script setup lang="ts">
import type { CategoryRule } from '~/types/categorization'

const show = defineModel<boolean>('show', { required: true })

const props = defineProps<{
  rule?: CategoryRule | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const { createRule, updateRule } = useCategorisation()

const formState = ref({
  name: '',
  keywords: [] as string[],
  color: '#22c55e',
  icon: 'i-lucide-tag'
})

const keywordInput = ref('')

const availableIcons = [
  'i-lucide-tag', 'i-lucide-shopping-cart', 'i-lucide-coffee', 'i-lucide-home',
  'i-lucide-car', 'i-lucide-plane', 'i-lucide-utensils', 'i-lucide-shirt',
  'i-lucide-heart', 'i-lucide-music', 'i-lucide-book', 'i-lucide-briefcase',
  'i-lucide-gift', 'i-lucide-zap', 'i-lucide-droplet', 'i-lucide-activity'
]

watch(() => props.rule, (newRule) => {
  if (newRule) {
    formState.value = {
      name: newRule.name,
      keywords: [...newRule.keywords],
      color: newRule.color,
      icon: newRule.icon
    }
  } else {
    formState.value = {
      name: '',
      keywords: [],
      color: '#22c55e',
      icon: 'i-lucide-tag'
    }
  }
  keywordInput.value = ''
}, { immediate: true })

function addKeyword() {
  const keyword = keywordInput.value.trim()
  if (keyword && !formState.value.keywords.includes(keyword)) {
    formState.value.keywords.push(keyword)
    keywordInput.value = ''
  }
}

function removeKeyword(keyword: string) {
  formState.value.keywords = formState.value.keywords.filter(k => k !== keyword)
}

function saveRule(close: () => void) {
  if (!formState.value.name || formState.value.keywords.length === 0) {
    return
  }

  if (props.rule) {
    updateRule(props.rule.id, formState.value)
  } else {
    createRule(formState.value)
  }

  close()
  emit('saved')
}
</script>

<template>
  <UModal v-model:open="show" :title="rule ? 'Edit Rule' : 'New Rule'">
    <template #body>
      <div class="space-y-6">
        <UFormGroup label="Category Name" required>
          <UInput v-model="formState.name" placeholder="e.g., Groceries" size="lg" />
        </UFormGroup>

        <UFormGroup label="Keywords" required>
          <div class="space-y-3">
            <div class="flex gap-2">
              <UInput
                v-model="keywordInput"
                placeholder="e.g., tesco, sainsbury"
                class="flex-1"
                size="lg"
                @keydown.enter.prevent="addKeyword"
              />
              <UButton
                icon="i-lucide-plus"
                size="lg"
                @click="addKeyword"
              />
            </div>

            <div v-if="formState.keywords.length > 0" class="flex flex-wrap gap-2 p-3 rounded-lg">
              <UBadge
                v-for="keyword in formState.keywords"
                :key="keyword"
                color="primary"
                variant="subtle"
                size="md"
              >
                {{ keyword }}
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="link"
                  size="xs"
                  class="ml-1 -mr-1"
                  @click="removeKeyword(keyword)"
                />
              </UBadge>
            </div>
          </div>
        </UFormGroup>

        <UFormGroup label="Icon">
          <div class="grid grid-cols-8 gap-2 p-3 rounded-lg">
            <UButton
              v-for="iconName in availableIcons"
              :key="iconName"
              :icon="iconName"
              :color="formState.icon === iconName ? 'primary' : 'neutral'"
              :variant="formState.icon === iconName ? 'solid' : 'outline'"
              size="md"
              square
              @click="formState.icon = iconName"
            />
          </div>
        </UFormGroup>

        <UFormGroup label="Color">
          <div class="flex gap-3 items-center">
            <input
              v-model="formState.color"
              type="color"
              class="w-14 h-14 rounded-lg border cursor-pointer"
            />
            <UInput v-model="formState.color" class="flex-1" size="lg" readonly />
          </div>
        </UFormGroup>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        @click="close"
      />
      <UButton
        :label="rule ? 'Update' : 'Create'"
        :disabled="!formState.name || formState.keywords.length === 0"
        @click="saveRule(close)"
      />
    </template>
  </UModal>
</template>
