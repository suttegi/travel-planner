<template>
  <section class="booking-section q-pa-lg">
    <div class="section-title q-mb-lg">{{ typeLabels[model.type] }}</div>

    <div class="row q-col-gutter-md">
      <div class="col-4">
        <div class="label">Фамилия</div>
        <q-input
          v-model="model.lastName"
          dense
          outlined
          placeholder="Как в документе, латиницей"
          :rules="[required, latin]"
        />
      </div>
      <div class="col-4">
        <div class="label">Имя</div>
        <q-input
          v-model="model.firstName"
          dense
          outlined
          placeholder="Как в документе, латиницей"
          :rules="[required, latin]"
        />
      </div>
      <div class="col-4">
        <div class="label">Дата рождения</div>
        <q-input
          v-model="model.birthDate"
          dense
          outlined
          placeholder="ДД.ММ.ГГГГ"
          mask="##.##.####"
          :rules="[required, validDate, ageMatchesType]"
        />
      </div>

      <div class="col-4">
        <div class="label">Гражданство</div>
        <q-select
          v-model="model.citizenship"
          dense
          outlined
          :options="countries"
          option-label="name"
          option-value="code"
          emit-value
          map-options
        />
      </div>
      <div class="col-4">
        <div class="label">Документ</div>
        <q-select
          v-model="model.docType"
          dense
          outlined
          :options="docOptions"
          emit-value
          map-options
        />
      </div>
      <div class="col-4">
        <div class="label">Номер документа</div>
        <q-input
          v-model="model.docNumber"
          dense
          outlined
          placeholder="Номер документа"
          :rules="[required]"
        />
      </div>

      <div v-if="model.docType !== 'birth_certificate'" class="col-4">
        <div class="label">Срок действия документа</div>
        <q-input
          v-model="model.docExpiry"
          dense
          outlined
          placeholder="ДД.ММ.ГГГГ"
          mask="##.##.####"
          :rules="[required, validDate, inFuture]"
        />
      </div>
      <div class="col-4 flex items-center">
        <q-radio v-model="model.gender" val="male" label="Мужской" color="brand" />
        <q-radio
          v-model="model.gender"
          val="female"
          label="Женский"
          color="brand"
          class="q-ml-md"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { date } from 'quasar';
import { getCountries } from '@/api/flight';
import type { Passenger, PassengerType } from '@/types/flight';

const model = defineModel<Passenger>({ required: true });

const typeLabels: Record<PassengerType, string> = {
  adult: 'Взрослый',
  child: 'Ребёнок',
  infant: 'Младенец',
};

const docOptions = [
  { label: 'Удостоверение личности РК', value: 'id_card' },
  { label: 'Паспорт', value: 'passport' },
  { label: 'Свидетельство о рождении', value: 'birth_certificate' },
];

const countries = ref([{ code: 'KZ', name: 'Казахстан' }]);

onMounted(() => {
  getCountries()
    .then(({ data }) => (countries.value = data))
    .catch(() => undefined);
});

const parse = (v: string) => date.extractDate(v, 'DD.MM.YYYY');
const isDate = (v: string) => /^\d{2}\.\d{2}\.\d{4}$/.test(v) && date.isValid(parse(v).toString());

const required = (v: string) => !!v || 'Обязательное поле';
const latin = (v: string) => /^[a-zA-Z\s-]+$/.test(v) || 'Только латиница';
const validDate = (v: string) => isDate(v) || 'Формат ДД.ММ.ГГГГ';
const inFuture = (v: string) => parse(v) > new Date() || 'Документ просрочен';

const ageMatchesType = (v: string) => {
  const age = date.getDateDiff(new Date(), parse(v), 'days') / 365.25;
  const ok = { adult: age >= 12, child: age >= 2 && age < 12, infant: age >= 0 && age < 2 };
  return (
    ok[model.value.type] || `Возраст не подходит: ${typeLabels[model.value.type].toLowerCase()}`
  );
};
</script>

<style lang="scss" scoped>
.label {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--q-brand-black);
}
</style>
