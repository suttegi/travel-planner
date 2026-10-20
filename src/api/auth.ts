import { api } from '@/boot/axios';
import type { User } from '@/types/auth';

export const login = (body: { username: string; password: string }) =>
  api.post<{ token: string; user: User }>('/auth/login', body);

export const getMe = () => api.get<User>('/auth/me');
