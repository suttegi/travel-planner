import { defineStore, acceptHMRUpdate } from 'pinia';
import { isAxiosError } from 'axios';
import type { User } from '@/types/auth';
import { getMe, login } from '@/api/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
  },

  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await login({ username, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        return true;
      } catch (error) {
        this.error = isAxiosError<{ message?: string }>(error)
          ? (error.response?.data?.message ?? 'Сервер недоступен')
          : 'Что-то пошло не так';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchMe() {
      try {
        const { data } = await getMe();
        this.user = data;
      } catch {
        this.logout();
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
