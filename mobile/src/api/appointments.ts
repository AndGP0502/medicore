import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  Paginated,
} from '@/types/api';

export function useAppointments(doctorId?: string) {
  return usePaginatedList<Appointment>(['appointments', doctorId ?? 'all'], async (page) => {
    const { data } = await api.get<Paginated<Appointment>>('/appointments', {
      params: { page, size: PAGE_SIZE, ...(doctorId ? { doctor_id: doctorId } : {}) },
    });
    return data;
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: async () => (await api.get<Appointment>(`/appointments/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AppointmentCreate) =>
      (await api.post<Appointment>('/appointments', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AppointmentUpdate }) =>
      (await api.put<Appointment>(`/appointments/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}
