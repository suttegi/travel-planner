<template>
  <q-dialog v-model="model">
    <q-card v-if="flight" class="details q-pa-md">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h5 text-weight-bold">Детали перелёта</div>
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="scroll" style="max-height: 70vh">
        <div v-for="(leg, idx) in flight.legs" :key="idx" class="q-mb-xl">
          <div class="text-h6 text-weight-bold q-mb-md">
            {{ leg.departure.city }} — {{ leg.arrival.city }}
          </div>

          <div v-for="segment in leg.segments" :key="segment.carrier.number">
            <div class="row items-center justify-between q-mb-md">
              <div class="row items-center q-gutter-x-sm">
                <div class="carrier-logo flex flex-center">
                  <img src="/assets/icons/airline.svg" :alt="segment.carrier.name" />
                </div>
                <div>
                  <div class="text-weight-bold">{{ segment.carrier.name }}</div>
                  <div class="text-caption text-grey-6">{{ segment.duration }}</div>
                </div>
              </div>
              <div class="flight-number">Рейс {{ segment.carrier.number }}</div>
            </div>

            <div
              v-for="point in [segment.departure, segment.arrival]"
              :key="point.code"
              class="row q-mt-md"
            >
              <div class="q-mr-lg" style="width: 60px">
                <div class="text-h6 text-weight-bold">{{ point.time }}</div>
                <div class="text-caption text-grey-6">{{ point.date }}</div>
              </div>
              <div class="col">
                <div class="text-weight-bold">{{ point.city }}</div>
                <div class="text-caption text-grey-6">{{ point.airport }}, {{ point.code }}</div>
              </div>
            </div>

            <div v-if="segment.layover" class="layover q-my-lg q-pa-md">
              <div class="text-weight-bold">Пересадка в городе {{ segment.arrival.city }}</div>
              <div class="text-grey-7 q-mt-xs">{{ segment.layover }}</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <template v-if="!hidePrice">
        <q-separator />

        <q-card-section class="row items-center justify-between">
          <div class="row items-baseline q-gutter-x-sm">
            <div class="text-h5 text-weight-bold">
              Итого:
              <span :class="{ 'text-gradient': flight.oldPrice }"
                >{{ flight.price.toLocaleString('ru-RU') }} ₸</span
              >
            </div>
            <div v-if="flight.oldPrice" class="text-strike text-grey-6">
              {{ flight.oldPrice.toLocaleString('ru-RU') }} ₸
            </div>
          </div>
          <q-btn
            v-if="!hideSelect"
            v-close-popup
            unelevated
            no-caps
            color="brand"
            label="Выбрать"
            class="brand-button text-weight-bold"
            @click="$emit('select', flight)"
          />
        </q-card-section>
      </template>
      <template v-else-if="passengers?.length">
        <q-separator />

        <q-card-section class="row q-gutter-sm">
          <q-chip v-for="p in passengers" :key="p.docNumber" icon="person" class="passenger">
            {{ p.lastName }} {{ p.firstName }}
          </q-chip>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { Flight, Passenger } from '@/types/flight';

defineProps<{
  flight: Flight | null;
  hideSelect?: boolean;
  hidePrice?: boolean;
  passengers?: Passenger[];
}>();
defineEmits<{ select: [flight: Flight] }>();

const model = defineModel<boolean>({ default: false });
</script>

<style lang="scss" scoped>
.details {
  width: 700px;
  max-width: 90vw;
  border-radius: 24px;
}

.carrier-logo {
  width: 40px;
  height: 40px;
  border: 1px solid #eee;
  border-radius: 50%;

  img {
    width: 24px;
    height: 24px;
  }
}

.flight-number {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.layover {
  border-radius: 16px;
  background: #f5f5f5;
}

.passenger {
  background: var(--q-page-bg);
}
</style>
