<template>
  <div class="autocomplete">
    <q-input
      standout
      bg-color="white"
      color="brand"
      :placeholder="label"
      :model-value="query"
      input-style="font-size: 16px"
      @update:model-value="onInput"
      @click="showMenu = true"
    >
      <template #prepend>
        <q-icon :name="`img:/assets/icons/search-${type}.svg`" size="sm" />
      </template>
    </q-input>

    <q-menu
      v-model="showMenu"
      no-parent-event
      no-focus
      no-refocus
      :offset="[0, 12]"
      class="popup-card shadow-5"
    >
      <q-card flat class="q-pa-lg" style="width: 350px">
        <div class="text-weight-bold q-mb-md" style="font-size: 20px">{{ label }}</div>
        <div v-if="loading" class="flex flex-center q-pa-md">
          <q-spinner-dots color="brand" size="2em" />
        </div>
        <div v-else-if="!items.length" class="text-grey-6 text-center q-pa-md">
          Ничего не найдено
        </div>
        <q-list v-else>
          <q-item
            v-for="item in items"
            :key="item.code ?? ''"
            clickable
            :ripple="false"
            @click="select(item)"
          >
            <q-item-section avatar>
              <q-icon name="location_city" size="xs" color="brand" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold" style="font-size: 16px">{{
                item.name
              }}</q-item-label>
              <q-item-label caption>{{ item.country }}</q-item-label>
            </q-item-section>
            <q-item-section side class="text-caption">{{ item.code }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'quasar';
import { autocomplete } from '@/api/flight';
import type { Location } from '@/types/flight';

const props = defineProps<{ type: 'from' | 'to'; modelValue: Location }>();
const emit = defineEmits<{ 'update:modelValue': [value: Location] }>();

const popularCities: Location[] = [
  { code: 'ALA', name: 'Алматы', country: 'Казахстан' },
  { code: 'NQZ', name: 'Астана', country: 'Казахстан' },
  { code: 'CIT', name: 'Шымкент', country: 'Казахстан' },
];

const label = computed(() => (props.type === 'from' ? 'Откуда' : 'Куда'));
const query = ref(props.modelValue.name ?? '');
const showMenu = ref(false);
const items = ref<Location[]>(popularCities);
const loading = ref(false);

const fetchItems = debounce(async (q: string) => {
  if (q.trim().length < 2) {
    items.value = popularCities;
    return;
  }
  loading.value = true;
  try {
    items.value = (await autocomplete(q.trim())).data;
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}, 300);

watch(
  () => props.modelValue.name,
  (name) => (query.value = name ?? ''),
);

const onInput = (val: string | number | null) => {
  query.value = String(val ?? '');
  showMenu.value = true;
  void fetchItems(query.value);
};

const select = (item: Location) => {
  showMenu.value = false;
  emit('update:modelValue', item);
};
</script>

<style lang="scss" scoped>
.autocomplete {
  position: relative;
}
</style>
