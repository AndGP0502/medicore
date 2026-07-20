import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type { MedicalRecord, MedicalRecordCreate, Paginated } from '@/types/api';

export function usePatientRecords(patientId: string | undefined) {
  return usePaginatedList<MedicalRecord>(
    ['medical-records', patientId],
    async (page) => {
      const { data } = await api.get<Paginated<MedicalRecord>>(
        `/medical-records/patient/${patientId}`,
        { params: { page, size: PAGE_SIZE } },
      );
      return data;
    },
  );
}

export function useMedicalRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['medical-records', 'detail', id],
    queryFn: async () => (await api.get<MedicalRecord>(`/medical-records/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MedicalRecordCreate) =>
      (await api.post<MedicalRecord>('/medical-records', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
}

export function useArchiveMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/medical-records/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical-records'] }),
  });
}
