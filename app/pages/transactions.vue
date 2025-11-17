<script setup lang="ts">
import { h, ref, computed, watch } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { getGroupedRowModel } from "@tanstack/vue-table";
import type { GroupingOptions } from "@tanstack/vue-table";
import {
  filterMirroredTransactions,
  useActivityStats,
  prepareTransactionRows,
  transactionUtils,
  type TransactionRow,
} from "~/composables/useActivityStats";
import { useDataProvider } from "~/composables/useDataProvider";

const { data, status, refresh, streamUpdate, isDemoMode } =
  useDataProvider();

watch(streamUpdate, (evt) => {
  if (evt?.source === "trading212") refresh();
});

const filteredTransactions = computed(() => {
  const transactions = data.value?.transactions || [];
  return filterMirroredTransactions(transactions);
});

const activityStats = useActivityStats(filteredTransactions);

const { stats, shiftMonth, shiftWeek, monthOffset, weekOffset } = activityStats;

const rows = computed<TransactionRow[]>(() => {
  if (!data.value?.transactions) return [];

  const preparedRows = prepareTransactionRows(data.value.transactions);
  return preparedRows.sort((a, b) => {
    if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? 1 : -1;
    return new Date(a.dateTime).getTime() < new Date(b.dateTime).getTime()
      ? 1
      : -1;
  });
});

const { formatGBP, getTypeColor } = transactionUtils;

const columns: TableColumn<TransactionRow>[] = [
  { id: "title", header: "Date" },
  { id: "day", accessorKey: "dayKey" },
  {
    accessorKey: "amount",
    header: () => h("div", { class: "text-right" }, "Amount"),
    cell: ({ row }) => {
      const amount = Number.parseFloat(String(row.getValue("amount")));
      const isGroup = row.getIsGrouped();
      return h(
        "div",
        {
          class: [
            "font-medium",
            isGroup ? "text-right" : "text-left",
            amount >= 0 ? "text-success" : "text-error",
          ],
        },
        `${amount >= 0 ? "+" : ""}${formatGBP(Math.abs(amount))}`
      );
    },
    aggregationFn: "sum",
  },
];

const grouping = ref<string[]>(["day"]);
const groupingOptions = ref<GroupingOptions>({
  groupedColumnMode: "remove",
  getGroupedRowModel: getGroupedRowModel(),
});

type SelectedGroup = { dayKey: string } | null;
const selectedGroup = ref<SelectedGroup>(null);

function selectFromRow(rowObj: any) {
  if (rowObj.getIsGrouped() && rowObj.groupingColumnId === "day") {
    selectedGroup.value = { dayKey: rowObj.original.dayKey };
  } else {
    const transaction = rowObj.original as TransactionRow;
    selectedGroup.value = { dayKey: transaction.dayKey };
  }
}

function isRowHighlighted(rowObj: any) {
  const selection = selectedGroup.value;
  if (!selection) return false;

  if (rowObj.getIsGrouped && rowObj.getIsGrouped()) {
    return rowObj.original.dayKey === selection.dayKey;
  }

  const transaction = rowObj.original as TransactionRow;
  return transaction && transaction.dayKey === selection.dayKey;
}
function rowAttrs(rowObj: any) {
  const highlighted = isRowHighlighted(rowObj);
  return {
    class: [
      "cursor-pointer transition-colors",
      "hover:bg-primary/5",
      highlighted ? "bg-primary/10 ring-1 ring-inset ring-primary/25" : "",
    ].join(" "),
    onClick: () => selectFromRow(rowObj),
    "aria-selected": highlighted || undefined,
  };
}

function formatSource(source: string): string {
  const formatted: Record<string, string> = {
    "bank-account": "Bank",
    "credit-card": "Card",
    trading212: "T212",
  };
  return formatted[source] || source;
}
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #body>
      <UPageGrid class="lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-px items-center">
        <UPageCard
          v-for="stat in stats"
          :key="stat.key"
          :icon="stat.icon"
          :title="stat.title"
          variant="subtle"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading:
              'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase',
          }"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
        >
          <div class="flex items-center justify-between">
            <UButton
              icon="i-lucide-chevron-left"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="stat.key === 'month' ? shiftMonth(-1) : shiftWeek(-1)"
            />
            <div class="flex flex-col items-center">
              <span class="text-2xl font-semibold text-highlighted"
                >-{{ stat.value }}</span
              >
              <span class="text-xs text-muted">{{ stat.label }}</span>
            </div>
            <UButton
              icon="i-lucide-chevron-right"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="stat.key === 'month' ? shiftMonth(1) : shiftWeek(1)"
            />
          </div>
        </UPageCard>
      </UPageGrid>

      <UCard :ui="{ body: 'p-0' }" class="overflow-hidden">
        <div class="overflow-auto max-h-[60vh]">
          <UTable
            :data="rows"
            :columns="columns"
            :grouping="grouping"
            :grouping-options="groupingOptions"
            row-key="uid"
            :row-attrs="rowAttrs"
            :ui="{ root: 'min-w-full', tr: 'align-middle', td: 'empty:p-0' }"
          >
            <template #title-cell="{ row }">
              <div class="flex items-center">
                <span
                  class="inline-block"
                  :style="{ width: `calc(${row.depth} * 1rem)` }"
                />
                <UButton
                  v-if="row.getIsGrouped() && row.getCanExpand()"
                  variant="outline"
                  color="neutral"
                  size="xs"
                  class="mr-2"
                  :icon="
                    row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'
                  "
                  @click.stop="row.toggleExpanded()"
                />
                <template v-if="row.getIsGrouped()">
                  <strong>{{ row.original.dayLabel }}</strong>
                </template>
                <template v-else>
                  <div class="flex items-center gap-3">
                    <UBadge
                      :color="getTypeColor(row.original.type) as any"
                      class="capitalize shrink-0"
                      variant="subtle"
                      size="xs"
                    >
                      {{ row.original.type.toLowerCase() }}
                    </UBadge>

                    <span class="text-sm font-medium">
                      {{ row.original.description || "No description" }}
                    </span>

                    <span class="text-xs text-muted/60">
                      · {{ formatSource(row.original.source) }}
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </UTable>
        </div>

        <div
          v-if="status === 'pending'"
          class="flex items-center justify-center py-10"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin text-2xl text-muted"
          />
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
