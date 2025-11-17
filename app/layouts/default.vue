<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
const { isDemoMode } = useDataProvider()
const route = useRoute()

const open = ref(false);

const links = [
  [
    {
      label: "Home",
      icon: "i-lucide-house",
      to: "/",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Transactions",
      icon: "i-lucide-dollar-sign",
      to: "/transactions",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Income",
      icon: "i-lucide-arrow-down-circle",
      to: "/income",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Categories",
      icon: "i-lucide-pie-chart",
      to: "/categories",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Rules",
      icon: "i-lucide-settings",
      to: "/rules",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Connections",
      icon: "i-lucide-link-2",
      to: "/connections",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
]);

const pageTitle = computed(() => {
  const allLinks = links.flat()
  const currentLink = allLinks.find(link => link.to === route.path)
  return currentLink?.label || 'Home'
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default mt-2.5"
        />

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
    <UDashboardPanel>
      <UDashboardNavbar :title="pageTitle" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge v-if="isDemoMode" color="info" variant="subtle"> Demo Mode </UBadge>
        </template>
        <template #right>
        <ConnectionsSyncBadge  />
        </template>
      </UDashboardNavbar>

      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
