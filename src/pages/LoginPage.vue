<template>
  <q-page class="flex flex-center">
    <q-card flat class="brand-card login-card q-pa-xl">
      <div class="text-h5 text-weight-bold q-mb-lg">Вход</div>
      <q-form class="column q-gutter-y-md" @submit="onSubmit">
        <q-input v-model="username" outlined label="Логин" />
        <q-input v-model="password" outlined type="password" label="Пароль" />
        <div v-if="auth.error" class="text-negative">{{ auth.error }}</div>
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="brand"
          label="Войти"
          class="brand-button"
          :loading="auth.loading"
        />
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');

const onSubmit = async () => {
  const ok = await auth.login(username.value, password.value);
  if (!ok) return;
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  await router.push(redirect);
};
</script>

<style lang="scss" scoped>
.login-card {
  width: 400px;
}
</style>
