<template>
  <q-page class="q-pb-xl">
    <div class="container tickets q-pt-lg">
      <h1 class="text-h5 text-weight-bold q-mt-none q-mb-lg">Мои билеты</h1>

      <div v-if="store.loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="brand" size="3em" />
      </div>
      <q-banner v-else-if="store.error" class="brand-card text-negative">{{
        store.error
      }}</q-banner>
      <div v-else-if="!store.bookings.length" class="brand-card text-center q-pa-xl">
        <q-icon name="confirmation_number" size="4em" color="grey-4" />
        <div class="text-h6 text-grey-5 q-mt-md">Пока нет билетов</div>
        <q-btn
          unelevated
          no-caps
          color="brand"
          label="Найти билеты"
          class="brand-button q-mt-lg"
          to="/"
        />
      </div>

      <template v-else>
        <flight-item
          v-for="b in store.bookings"
          :key="b.book_id"
          :flight="b.flight"
          hide-price
          @details="openDetails(b)"
        >
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-sm">
              <div class="book-id">{{ b.book_id }}</div>
              <q-chip v-for="p in b.passengers" :key="p.docNumber" icon="person" class="passenger">
                {{ p.lastName }} {{ p.firstName }}
              </q-chip>
            </div>
            <div class="text-caption text-grey-6">
              Тариф {{ b.fare.name }} · оформлено {{ formatCreated(b.createdAt) }}
            </div>
          </div>
        </flight-item>
      </template>
    </div>

    <flight-details-modal
      v-model="showDetails"
      :flight="detailsBooking?.flight ?? null"
      :passengers="detailsBooking?.passengers ?? []"
      hide-price
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { date } from 'quasar';
import { useFlightStore } from '@/stores/flight';
import type { Booking } from '@/types/flight';
import FlightItem from '@/components/flight/FlightItem.vue';
import FlightDetailsModal from '@/components/flight/FlightDetailsModal.vue';

const store = useFlightStore();
const showDetails = ref(false);
const detailsBooking = ref<Booking | null>(null);

onMounted(() => store.loadBookings());

const openDetails = (booking: Booking) => {
  detailsBooking.value = booking;
  showDetails.value = true;
};

const formatCreated = (iso: string) => date.formatDate(iso, 'DD.MM.YYYY, HH:mm');
</script>

<style lang="scss" scoped>
.tickets {
  max-width: 900px;
}

.book-id {
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--q-brand-light);
  color: var(--q-brand-dark);
  font-weight: 700;
  font-size: 14px;
}

.passenger {
  background: var(--q-page-bg);
}
</style>
