import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: 'search-results', component: () => import('@/pages/flight/SearchResultPage.vue') },
      {
        path: 'booking/:flightId',
        component: () => import('@/pages/flight/BookPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'my-tickets',
        component: () => import('@/pages/MyTicketsPage.vue'),
        meta: { requiresAuth: true },
      },
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
