<template>
  <q-page>
    <section class="search-hero search-hero--collapsed">
      <div class="container">
        <search-form />
      </div>
    </section>

    <div class="container q-mt-lg">
      <div class="results-layout row no-wrap">
        <aside class="sidebar">
          <filter-sidebar :airlines="store.airlines" />
        </aside>

        <div class="col">
          <div v-if="store.loading" class="brand-card text-center q-pa-xl">
            <q-spinner-dots color="brand" size="3em" />
            <div class="text-h6 text-grey-5 q-mt-md">Ищем лучшие предложения...</div>
          </div>
          <q-banner v-else-if="store.error" class="brand-card text-negative">{{
            store.error
          }}</q-banner>
          <div v-else-if="!store.filteredFlights.length" class="brand-card text-center q-pa-xl">
            <q-icon name="flight_takeoff" size="4em" color="grey-4" />
            <div class="text-h6 text-grey-5 q-mt-md">Ничего не найдено</div>
          </div>
          <template v-else>
            <flight-item
              v-for="flight in store.filteredFlights"
              :key="flight.id"
              :flight="flight"
              :is-cheapest="flight.id === store.cheapestId"
              :is-fastest="flight.id === store.fastestId"
              @details="openDetails"
              @select="selectFlight"
            />
          </template>
        </div>
      </div>
    </div>

    <flight-details-modal v-model="showDetails" :flight="detailsFlight" @select="selectFlight" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFlightStore } from '@/stores/flight';
import type { Flight } from '@/types/flight';
import SearchForm from '@/components/flight/SearchForm.vue';
import FilterSidebar from '@/components/flight/FilterSidebar.vue';
import FlightItem from '@/components/flight/FlightItem.vue';
import FlightDetailsModal from '@/components/flight/FlightDetailsModal.vue';

const store = useFlightStore();
const router = useRouter();

const showDetails = ref(false);
const detailsFlight = ref<Flight | null>(null);

const openDetails = (flight: Flight) => {
  detailsFlight.value = flight;
  showDetails.value = true;
};

const selectFlight = (flight: Flight) => {
  store.selectFlight(flight);
  void router.push(`/booking/${flight.id}`);
};
</script>

<style lang="scss" scoped>
.results-layout {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 32%;
  min-width: 320px;
  flex-shrink: 0;
}
</style>
