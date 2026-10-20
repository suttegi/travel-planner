import { defineBoot } from '#q-app';
import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({ baseURL: 'http://localhost:3001' });

export default defineBoot(({ store, router }) => {
  api.interceptors.request.use((config) => {
    const auth = useAuthStore(store);
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const route = router.currentRoute.value;
      if (error.response?.status === 401 && route.path !== '/login') {
        useAuthStore(store).logout();
        if (route.meta.requiresAuth) {
          void router.push({ path: '/login', query: { redirect: route.fullPath } });
        }
      }
      return Promise.reject(error);
    },
  );
});

export { api };
