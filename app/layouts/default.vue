<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
},{
  label: 'Transactions',
  icon: 'i-lucide-dollar-sign',
  to: '/transactions',
  onSelect: () => {
    open.value = false
  }
}, 
{
  label: 'Income',
  icon: 'i-lucide-arrow-down-circle',
  to: '/income',
  onSelect: () => {
    open.value = false
  }
}, 
{
  label: 'Categories',
  icon: 'i-lucide-pie-chart',
  to: '/categories',
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Rules',
  icon: 'i-lucide-settings',
  to: '/rules',
  onSelect: () => {
    open.value = false
  }
},
{
  label: 'Connections',
  icon: 'i-lucide-link-2',
  to: '/connections',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem" >
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default mt-2.5" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

  </UDashboardGroup>
</template>
