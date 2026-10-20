<template>
  <q-page>
    <section class="search-hero">
      <div class="container text-center text-white">
        <h1 class="search-hero__title q-my-none">Авиабилеты по выгодным ценам</h1>
        <div class="search-hero__subtitle q-mt-sm">
          Найдите и забронируйте перелёт за пару минут
        </div>
        <search-form class="q-mt-lg" />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import SearchForm from '@/components/flight/SearchForm.vue';
</script>
