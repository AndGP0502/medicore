import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type { Paginated, Patient, PatientCreate, PatientUpdate } from '@/types/api';

export function usePatients(search: string) {
  return usePaginatedList<Patient>(['patients', search], async (page) => {
    const { data } = await api.get<Paginated<Patient>>('/patients', {
      params: { search, page, size: PAGE_SIZE },
    });
    return data;
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', 'detail', id],
    queryFn: async () => (await api.get<Patient>(`/patients/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PatientCreate) =>
      (await api.post<Patient>('/patients', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PatientUpdate) =>
      (await api.put<Patient>(`/patients/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeactivatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/patients/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
