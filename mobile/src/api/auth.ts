import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Role, User } from '@/types/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<User[]>('/users')).data,
  });
}

export function useDoctors() {
  return useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: async () => (await api.get<User[]>('/users/doctors')).data,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['users', 'roles'],
    queryFn: async () => (await api.get<Role[]>('/users/roles')).data,
  });
}
