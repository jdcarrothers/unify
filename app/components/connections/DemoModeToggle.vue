<script setup lang="ts">
import { useDemoMode } from '~/composables/useDemoMode'

const { isDemoMode, toggleDemoMode } = useDemoMode()
</script>

<template>
  <UButton 
    :label="isDemoMode ? 'Stop Demo' : 'Start Demo'"
    :color="isDemoMode ? 'warning' : 'neutral'"
    variant="outline"
    @click="toggleDemoMode"
  />
</template>