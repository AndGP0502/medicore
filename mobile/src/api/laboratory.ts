import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type {
  LabOrder,
  LabOrderCreate,
  LabOrderUpdate,
  LabResultCreate,
  Paginated,
} from '@/types/api';

export function useLabOrders(patientId?: string) {
  return usePaginatedList<LabOrder>(['lab-orders', patientId ?? 'all'], async (page) => {
    const { data } = await api.get<Paginated<LabOrder>>('/laboratory/orders', {
      params: { page, size: PAGE_SIZE, ...(patientId ? { patient_id: patientId } : {}) },
    });
    return data;
  });
}

export function useCreateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: LabOrderCreate) =>
      (await api.post<LabOrder>('/laboratory/orders', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  });
}

export function useUpdateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LabOrderUpdate }) =>
      (await api.put<LabOrder>(`/laboratory/orders/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  });
}

export function useArchiveLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/laboratory/orders/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  });
}

export function useAddLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: LabResultCreate) =>
      (await api.post('/laboratory/results', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  });
}
