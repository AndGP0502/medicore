import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { DashboardStats, PatientStats, RevenueReport } from '@/types/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/reports/dashboard')).data,
  });
}

export function useRevenueReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: async () =>
      (
        await api.get<RevenueReport>('/reports/revenue', {
          params: { start_date: startDate, end_date: endDate },
        })
      ).data,
    enabled: !!startDate && !!endDate,
  });
}

export function usePatientStats() {
  return useQuery({
    queryKey: ['reports', 'patients'],
    queryFn: async () => (await api.get<PatientStats>('/reports/patients')).data,
  });
}
