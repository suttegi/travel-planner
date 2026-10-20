<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-white main-header">
      <div class="container row items-center no-wrap q-py-sm">
        <router-link to="/" class="logo text-brand">Travel Planner</router-link>

        <div class="nav-pill row items-center no-wrap q-gutter-x-sm q-ml-lg">
          <q-icon name="img:/assets/icons/avia.svg" size="24px" />
          <span>Авиабилеты</span>
        </div>

        <q-space />

        <q-btn v-if="!auth.isLoggedIn" flat no-caps :ripple="false" to="/login">
          <q-icon name="img:/assets/icons/user.svg" size="24px" />
          <span class="q-ml-xs">Войти</span>
        </q-btn>

        <q-btn v-else flat no-caps :ripple="false">
          <q-icon name="img:/assets/icons/user.svg" size="24px" />
          <span class="q-ml-xs">{{ auth.user?.username ?? 'Профиль' }}</span>
          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="popup-card">
            <q-list class="q-pa-sm" style="min-width: 200px">
              <q-item v-close-popup clickable to="/my-tickets" class="menu-item">
                <q-item-section avatar>
                  <q-icon name="confirmation_number" />
                </q-item-section>
                <q-item-section>Мои билеты</q-item-section>
              </q-item>
              <q-item v-close-popup clickable class="menu-item" @click="onLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Выйти</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (auth.token && !auth.user) void auth.fetchMe();
});

const onLogout = () => {
  auth.logout();
  void router.push('/');
};
</script>

<style lang="scss" scoped>
.main-header {
  color: var(--q-brand-black);
  border-bottom: 1px solid #ebedf0;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
}

.nav-pill {
  min-height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  background: var(--q-brand-light);
  font-size: 16px;
}

.menu-item {
  border-radius: 12px;
}
</style>
