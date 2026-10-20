<template>
  <div class="brand-card filter-sidebar q-pa-lg">
    <div class="row q-mb-lg">
      <q-btn
        v-for="s in sortOptions"
        :key="s.value"
        unelevated
        no-caps
        class="col"
        :class="store.sort === s.value ? 'sort-active' : 'text-grey-8'"
        :label="s.label"
        @click="store.sort = s.value"
      />
    </div>

    <q-separator class="q-mb-lg" />

    <div class="title q-mb-md">Пересадки</div>
    <div class="text-grey-8 q-mb-sm">Количество пересадок</div>
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        v-for="s in stopsOptions"
        :key="s.value"
        unelevated
        no-caps
        class="pill"
        :outline="store.filters.stops !== s.value"
        :color="store.filters.stops === s.value ? 'brand' : 'grey-4'"
        :text-color="store.filters.stops === s.value ? 'white' : 'grey-9'"
        :label="s.label"
        @click="store.filters.stops = s.value"
      />
    </div>
    <template v-if="store.filters.stops !== 0">
      <div class="text-grey-8 q-mb-sm">Длительность пересадки</div>
      <div class="row q-gutter-sm q-mb-lg">
        <q-btn
          v-for="h in [3, 6, 12, 24]"
          :key="h"
          unelevated
          no-caps
          class="pill"
          :outline="store.filters.stopsDuration !== h"
          :color="store.filters.stopsDuration === h ? 'brand' : 'grey-4'"
          :text-color="store.filters.stopsDuration === h ? 'white' : 'grey-9'"
          :label="`до ${h} ч`"
          @click="store.filters.stopsDuration = h"
        />
      </div>
    </template>

    <q-separator class="q-mb-lg" />

    <div class="title q-mb-md">Время вылета и прилёта</div>
    <div v-for="r in timeRanges" :key="r.key" class="q-mb-lg">
      <div class="row justify-between">
        <div>{{ r.label }}</div>
        <div class="text-caption text-grey-6">
          {{ formatHour(store.filters[r.key].min) }} – {{ formatHour(store.filters[r.key].max) }}
        </div>
      </div>
      <q-range v-model="store.filters[r.key]" :min="0" :max="24" color="brand" class="q-mt-sm" />
      <div class="row q-gutter-xs">
        <q-btn
          v-for="p in dayParts"
          :key="p.label"
          flat
          dense
          no-caps
          class="col time-btn"
          :label="p.label"
          @click="store.filters[r.key] = { min: p.min, max: p.max }"
        />
      </div>
    </div>

    <q-separator class="q-mb-md" />

    <q-expansion-item label="Авиакомпании" header-class="title q-px-none" default-opened>
      <div class="column q-gutter-y-xs">
        <q-checkbox
          v-for="airline in airlines"
          :key="airline"
          v-model="store.filters.airlines"
          :val="airline"
          :label="airline"
          dense
          color="brand"
        />
      </div>
    </q-expansion-item>

    <div class="text-center q-mt-lg">
      <span class="reset text-caption text-grey-6 cursor-pointer" @click="store.resetFilters()"
        >Сбросить все фильтры</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFlightStore } from '@/stores/flight';
import type { Filters, SortType } from '@/types/flight';

defineProps<{ airlines: string[] }>();

const store = useFlightStore();

const sortOptions: { label: string; value: SortType }[] = [
  { label: 'Дешевле', value: 'cheaper' },
  { label: 'Раньше', value: 'earlier' },
  { label: 'Быстрее', value: 'faster' },
];

const stopsOptions: { label: string; value: Filters['stops'] }[] = [
  { label: 'Без пересадок', value: 0 },
  { label: 'Не более 1', value: 1 },
  { label: 'Все рейсы', value: 'all' },
];

const dayParts = [
  { label: 'Утро', min: 6, max: 12 },
  { label: 'День', min: 12, max: 18 },
  { label: 'Вечер', min: 18, max: 24 },
];

const from = computed(() => store.searchForm.from.name ?? '...');
const to = computed(() => store.searchForm.to.name ?? '...');

const timeRanges = computed(() => {
  const ranges: { key: 'time1' | 'time2' | 'time3' | 'time4'; label: string }[] = [
    { key: 'time1', label: `Вылет из ${from.value}` },
    { key: 'time2', label: `Прилёт в ${to.value}` },
  ];
  if (store.searchForm.isRoundTrip) {
    ranges.push(
      { key: 'time3', label: `Вылет из ${to.value}` },
      { key: 'time4', label: `Прилёт в ${from.value}` },
    );
  }
  return ranges;
});

const formatHour = (h: number) => (h === 24 ? '23:59' : `${String(h).padStart(2, '0')}:00`);
</script>

<style lang="scss" scoped>
.filter-sidebar {
  font-size: 14px;
}

.title,
:deep(.title) {
  font-size: 16px;
  font-weight: 700;
}

.sort-active {
  background: var(--q-brand-light);
  color: var(--q-brand-dark);
  font-weight: 700;
  border-radius: 8px;
}

.pill {
  border-radius: 12px;
}

.time-btn {
  border-radius: 12px;
  background: #fafafa;
  color: var(--q-brand-text-gray);
}

.reset {
  border-bottom: 1px dashed;
}
</style>
