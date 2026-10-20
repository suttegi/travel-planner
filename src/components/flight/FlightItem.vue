<template>
  <q-card
    flat
    class="brand-card flight-item q-mb-lg cursor-pointer"
    @click="$emit('details', flight)"
  >
    <q-card-section>
      <div v-if="!hidePrice && (isCheapest || isFastest || flight.oldPrice)" class="labels row">
        <div v-if="isCheapest" class="label cheapest">Самый дешёвый</div>
        <div v-if="isFastest" class="label fastest">Самый быстрый</div>
        <div v-if="flight.oldPrice" class="label discount">Скидка</div>
      </div>

      <div v-if="!hidePrice" class="row items-center justify-between q-mb-lg">
        <div class="row items-baseline q-gutter-x-sm">
          <div class="price" :class="{ 'text-gradient': flight.oldPrice }">
            {{ formatPrice(flight.price) }} ₸
          </div>
          <div v-if="flight.oldPrice" class="text-strike text-grey-6">
            {{ formatPrice(flight.oldPrice) }} ₸
          </div>
        </div>
        <q-btn
          unelevated
          no-caps
          color="brand"
          label="Выбрать"
          class="choose-btn"
          @click.stop="$emit('select', flight)"
        />
      </div>

      <div
        v-for="(leg, idx) in flight.legs"
        :key="idx"
        class="row no-wrap"
        :class="{ 'q-mt-lg': idx > 0 }"
      >
        <div class="logos q-mr-md">
          <img
            v-for="(segment, sIdx) in leg.segments.slice(0, 2)"
            :key="sIdx"
            src="/assets/icons/airline.svg"
            :alt="segment.carrier.name"
            class="logo"
            :style="{ top: `${sIdx * 18}px`, zIndex: 2 - sIdx }"
          />
        </div>

        <div class="col">
          <div class="row items-center no-wrap q-my-sm">
            <div class="time">{{ leg.departure.time }}</div>
            <div class="col q-px-md">
              <div class="row items-center no-wrap text-grey-6 duration">
                <q-icon name="img:/assets/icons/avia_departure.svg" size="16px" />
                <div class="col text-center ellipsis">
                  {{ leg.duration }} в пути, {{ transfersLabel(leg.transfers) }}
                </div>
                <q-icon name="img:/assets/icons/avia_arrival.svg" size="16px" />
              </div>
              <div class="route-line" />
              <div class="row justify-between codes">
                <span>{{ leg.departure.code }}</span>
                <span v-for="segment in leg.segments" :key="segment.carrier.number">{{
                  segment.arrival.code
                }}</span>
              </div>
            </div>
            <div class="time">{{ leg.arrival.time }}</div>
          </div>

          <div class="row justify-between">
            <div>
              <div class="text-weight-medium">{{ leg.departure.city }}</div>
              <div class="text-caption text-grey-6">{{ leg.departure.date }}</div>
            </div>
            <div class="text-right">
              <div class="text-weight-medium">{{ leg.arrival.city }}</div>
              <div class="text-caption text-grey-6">{{ leg.arrival.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <template v-if="$slots.default">
        <q-separator class="q-my-md" />
        <slot />
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Flight } from '@/types/flight';

defineProps<{
  flight: Flight;
  isCheapest?: boolean;
  isFastest?: boolean;
  hidePrice?: boolean;
}>();
defineEmits<{ details: [flight: Flight]; select: [flight: Flight] }>();

const formatPrice = (value: number) => value.toLocaleString('ru-RU');
const transfersLabel = (n: number) =>
  n === 0 ? 'прямой' : n === 1 ? '1 пересадка' : `${n} пересадки`;
</script>

<style lang="scss" scoped>
.flight-item {
  position: relative;
  overflow: visible;
}

.labels {
  position: absolute;
  top: -1em;
  left: 24px;
  gap: 0.3em;

  .label {
    border-radius: 12px;
    padding: 4px 12px;
    color: white;
    font-size: 15px;
    font-weight: 600;

    &.cheapest {
      background: var(--q-brand-green);
    }
    &.fastest {
      background: var(--q-brand-blue);
    }
    &.discount {
      background: var(--q-brand-gradient);
    }
  }
}

.price {
  font-size: 26px;
  font-weight: 700;
  line-height: 32px;
}

.choose-btn {
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  padding: 0 24px;
  height: 40px;
}

.logos {
  position: relative;
  width: 42px;
  height: 48px;

  .logo {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid white;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.time {
  font-size: 20px;
  font-weight: 600;
}

.duration {
  font-size: 15px;
  font-weight: 500;
  gap: 4px;
}

.route-line {
  height: 4px;
  margin: 4px 0;
  border-radius: 2px;
  background: var(--q-gray-button);
}

.codes {
  font-size: 13px;
  font-weight: 700;
  color: var(--q-brand-dark);
}
</style>
