<template>
  <q-page class="q-pb-xl">
    <div v-if="store.loading && !store.selectedFlight" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="brand" size="3em" />
    </div>
    <q-banner
      v-else-if="!store.selectedFlight"
      class="container brand-card text-negative q-mt-lg"
      >{{ store.error }}</q-banner
    >
    <div v-else class="container booking-layout row no-wrap q-pt-lg">
      <q-form ref="formRef" greedy class="col column q-gutter-y-lg">
        <section class="booking-section q-pa-lg">
          <h2 class="text-h5 text-weight-bold q-mt-none q-mb-md">Выберите тариф</h2>
          <div class="row q-col-gutter-md">
            <div v-for="fare in store.fares" :key="fare.id" class="col-4">
              <q-card
                flat
                bordered
                class="fare-card column no-wrap q-pa-lg cursor-pointer"
                :class="{ selected: store.selectedFareId === fare.id }"
                @click="store.selectedFareId = fare.id"
              >
                <div class="row items-center q-mb-sm">
                  <q-radio v-model="store.selectedFareId" :val="fare.id" color="brand" />
                  <div class="text-weight-bold">{{ fare.name }}</div>
                </div>
                <ul class="features col-grow text-caption text-grey-8">
                  <li
                    v-for="feat in fare.features"
                    :key="feat.text"
                    class="row items-start q-mb-xs"
                  >
                    <q-icon
                      :name="feat.included ? 'check' : 'close'"
                      :color="feat.included ? 'positive' : 'grey-5'"
                      size="16px"
                      class="q-mr-xs"
                    />
                    {{ feat.text }}
                  </li>
                </ul>
                <div class="text-center q-mt-md">
                  <div v-if="fare.oldPrice" class="text-strike text-grey-6 text-caption">
                    {{ formatPrice(fare.oldPrice) }} ₸
                  </div>
                  <div class="text-h6 text-weight-bold" :class="{ 'text-gradient': fare.oldPrice }">
                    {{ formatPrice(fare.price) }} ₸
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </section>

        <passenger-form
          v-for="(_, index) in store.passengers"
          :key="index"
          v-model="store.passengers[index]!"
        />

        <section class="booking-section q-pa-lg">
          <div class="section-title q-mb-md">Контактные данные</div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model="store.contact.phone"
                outlined
                label="Телефон"
                mask="+7 (###) ### - ## - ##"
                unmasked-value
                :rules="[(v: string) => v.length === 10 || 'Введите номер полностью']"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="store.contact.email"
                outlined
                label="Email"
                placeholder="example@mail.com"
                :rules="[(v: string) => /.+@.+\..+/.test(v) || 'Неверный email']"
              />
            </div>
          </div>
        </section>
      </q-form>

      <aside class="sidebar">
        <div class="sticky column q-gutter-y-lg">
          <q-card v-if="store.selectedFlight" flat bordered class="side-card q-pa-lg">
            <div
              v-for="(leg, idx) in store.selectedFlight.legs"
              :key="idx"
              :class="{ 'q-mt-md': idx > 0 }"
            >
              <div class="row items-center no-wrap q-gutter-x-sm">
                <div class="text-h6 text-weight-bold">{{ leg.departure.time }}</div>
                <div class="text-caption text-grey-6">{{ leg.departure.code }}</div>
                <div class="col dashed" />
                <div class="text-caption text-grey-6">{{ leg.arrival.code }}</div>
                <div class="text-h6 text-weight-bold">{{ leg.arrival.time }}</div>
              </div>
              <div class="row justify-between text-caption text-grey-6">
                <div>{{ leg.departure.date }}</div>
                <div>{{ leg.arrival.date }}</div>
              </div>
            </div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Детали перелёта"
              class="q-mt-sm"
              @click="showDetails = true"
            />
          </q-card>

          <q-card flat bordered class="side-card q-pa-lg">
            <div class="row justify-between q-mb-lg text-weight-bold">
              <span>Авиабилеты</span>
              <span>{{ formatPrice(store.ticketPrice) }} ₸</span>
            </div>
            <div class="row justify-between items-end q-mb-lg">
              <span class="text-h6 text-weight-bold">Итого к оплате:</span>
              <span class="text-h5 text-weight-bold text-brand"
                >{{ formatPrice(store.ticketPrice) }} ₸</span
              >
            </div>
            <div v-if="store.error" class="text-negative q-mb-md" style="white-space: pre-line">
              {{ store.error }}
            </div>
            <q-btn
              unelevated
              no-caps
              color="brand"
              label="Перейти к оплате"
              class="full-width brand-button text-weight-bold"
              :loading="store.loading"
              @click="onBook"
            />
          </q-card>
        </div>
      </aside>
    </div>

    <flight-details-modal v-model="showDetails" :flight="store.selectedFlight" hide-select />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, type QForm } from 'quasar';
import { useFlightStore } from '@/stores/flight';
import PassengerForm from '@/components/flight/PassengerForm.vue';
import FlightDetailsModal from '@/components/flight/FlightDetailsModal.vue';

const store = useFlightStore();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const formRef = ref<QForm | null>(null);

onMounted(() => store.loadBooking(String(route.params.flightId)));

const onBook = async () => {
  if (!(await formRef.value?.validate())) return;
  if (await store.book()) {
    $q.notify({ type: 'positive', message: `Бронь ${store.orderId} оформлена` });
    await router.push('/my-tickets');
  }
};

const showDetails = ref(false);

const formatPrice = (value: number) => value.toLocaleString('ru-RU');
</script>

<style lang="scss" scoped>
.booking-layout {
  display: flex;
  gap: 24px;
  max-width: 1200px;
}

.sidebar {
  width: 32%;
  min-width: 320px;
  flex-shrink: 0;
}

.sticky {
  position: sticky;
  top: 100px;
}

.side-card {
  border-radius: 16px;
}

.dashed {
  border-bottom: 2px dashed #ccc;
}

.fare-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s ease;

  &.selected {
    border: 2px solid var(--q-brand);
    background: var(--q-brand-tint);
  }
}

.features {
  list-style: none;
  padding-left: 0;
}
</style>
