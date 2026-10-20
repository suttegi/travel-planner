<template>
  <div class="search-form row items-center bg-white q-pa-sm shadow-2">
    <autocomplete-input v-model="store.searchForm.from" type="from" class="field" />
    <q-btn flat round dense icon="swap_horiz" color="brand" @click="store.reverseRoutes()" />
    <autocomplete-input v-model="store.searchForm.to" type="to" class="field" />

    <div class="dates row no-wrap cursor-pointer">
      <q-input
        standout
        readonly
        bg-color="white"
        placeholder="Туда"
        :model-value="formatDate(store.searchForm.date)"
        input-class="cursor-pointer"
      >
        <template #prepend>
          <q-icon name="img:/assets/icons/date-one-way.svg" size="sm" />
        </template>
      </q-input>
      <q-input
        standout
        readonly
        bg-color="white"
        placeholder="Обратно"
        :model-value="formatDate(store.searchForm.returnDate)"
        input-class="cursor-pointer"
      >
        <template #prepend>
          <q-icon name="img:/assets/icons/date-return.svg" size="sm" />
        </template>
      </q-input>

      <q-menu :offset="[0, 12]" class="popup-card shadow-5" @show="loadPrices">
        <q-card flat class="q-pa-lg">
          <div class="row items-center justify-between q-mb-md q-gutter-x-md">
            <div class="text-weight-bold" style="font-size: 20px">Когда</div>
            <div class="row items-center no-wrap">
              <q-toggle v-model="oneWay" color="brand" label="Обратный билет не нужен" left-label />
              <q-btn v-close-popup icon="close" flat round dense class="close-btn q-ml-sm" />
            </div>
          </div>
          <q-date
            v-model="dates"
            :range="!oneWay"
            :options="isAvailable"
            mask="YYYY-MM-DD"
            :events="isCheap"
            event-color="positive"
            minimal
            flat
            color="brand"
          />
          <div v-if="cheapDates.size" class="row items-center text-caption text-grey-7 q-mt-sm">
            <span class="cheap-dot q-mr-xs" />
            Самые дешёвые дни
          </div>
        </q-card>
      </q-menu>
    </div>

    <div class="field passengers">
      <q-input
        standout
        readonly
        bg-color="white"
        :model-value="passengersLabel"
        input-class="cursor-pointer"
      >
        <template #prepend>
          <q-icon name="img:/assets/icons/search-passengers.svg" size="sm" />
        </template>
        <template #append>
          <q-icon name="keyboard_arrow_down" size="sm" color="brand" />
        </template>
      </q-input>

      <q-menu anchor="bottom right" self="top right" :offset="[0, 12]" class="popup-card shadow-5">
        <q-card flat class="q-pa-lg" style="width: 350px">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-weight-bold" style="font-size: 20px">Пассажиры</div>
            <q-btn v-close-popup icon="close" flat round dense class="close-btn" />
          </div>

          <div
            v-for="row in passengerRows"
            :key="row.key"
            class="row items-center justify-between q-mb-lg"
          >
            <div>
              <div class="text-weight-bold" style="font-size: 16px">{{ row.title }}</div>
              <div class="text-caption text-grey-6">{{ row.subtitle }}</div>
            </div>
            <div class="row items-center no-wrap q-gutter-x-md">
              <q-btn
                round
                flat
                dense
                class="close-btn"
                icon="remove"
                @click="store.decrementPassenger(row.key)"
              />
              <div class="text-h6 text-weight-bold">{{ store.searchForm.passengers[row.key] }}</div>
              <q-btn
                round
                flat
                dense
                class="bg-brand"
                icon="add"
                @click="store.incrementPassenger(row.key)"
              />
            </div>
          </div>

          <div class="text-weight-bold q-mb-sm" style="font-size: 16px">Класс обслуживания</div>
          <q-option-group v-model="store.searchForm.cabin" :options="cabinOptions" color="brand" />
        </q-card>
      </q-menu>
    </div>

    <q-btn
      unelevated
      no-caps
      color="brand"
      class="brand-button"
      label="Найти"
      :loading="store.loading"
      @click="onSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { date, useQuasar } from 'quasar';
import { getCalendarPrices } from '@/api/flight';
import { useFlightStore } from '@/stores/flight';
import type { PassengerCountKey } from '@/types/flight';
import AutocompleteInput from './AutocompleteInput.vue';

const store = useFlightStore();
const router = useRouter();
const $q = useQuasar();

const passengerRows: { key: PassengerCountKey; title: string; subtitle: string }[] = [
  { key: 'adt', title: 'Взрослые', subtitle: 'от 12 лет' },
  { key: 'chd', title: 'Дети', subtitle: 'от 2 до 12 лет' },
  { key: 'inf', title: 'Младенцы', subtitle: 'до 2 лет, без места' },
];

const cabinOptions = [
  { label: 'Эконом', value: 'economy' },
  { label: 'Бизнес', value: 'business' },
];

const passengersLabel = computed(
  () => `${store.passengersCount}, ${store.searchForm.cabin === 'business' ? 'Бизнес' : 'Эконом'}`,
);

const oneWay = computed({
  get: () => !store.searchForm.isRoundTrip,
  set: (val: boolean) => (store.searchForm.isRoundTrip = !val),
});

const dates = computed({
  get: () => {
    const { date: from, returnDate: to } = store.searchForm;
    if (!from) return null;
    return to && store.searchForm.isRoundTrip ? { from, to } : from;
  },
  set: (val) => store.setDates(val),
});

const today = date.formatDate(Date.now(), 'YYYY/MM/DD');
const isAvailable = (d: string) => d >= today;

const formatDate = (value: string | null) => (value ? date.formatDate(value, 'D MMM, dd') : '');

const prices = ref<Record<string, number>>({});

const loadPrices = async () => {
  const { from, to } = store.searchForm;
  if (!from.code || !to.code) return;
  try {
    prices.value = (await getCalendarPrices(from.code, to.code)).data;
  } catch {
    prices.value = {};
  }
};

const cheapDates = computed(() => {
  const sorted = Object.entries(prices.value).sort(([, a], [, b]) => a - b);
  const cheap = sorted.slice(0, Math.ceil(sorted.length * 0.2));
  return new Set(cheap.map(([day]) => day.replaceAll('-', '/')));
});

const isCheap = (d: string) => cheapDates.value.has(d);

const onSearch = async () => {
  if (await store.search()) await router.push('/search-results');
  else if (store.error) $q.notify({ type: 'negative', message: store.error });
};
</script>

<style lang="scss" scoped>
.search-form {
  border-radius: 12px;
  gap: 8px;
  flex-wrap: nowrap;
}

.field {
  flex: 1 1 0;
  min-width: 160px;
}

.dates {
  flex: 2 1 0;
  min-width: 260px;
  gap: 8px;

  > * {
    flex: 1;
  }
}

.cheap-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--q-positive);
}

.close-btn {
  background: #f4f6f8;
  border-radius: 12px;
}
</style>
