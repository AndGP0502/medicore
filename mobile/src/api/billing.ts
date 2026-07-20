import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type { Invoice, InvoiceCreate, Paginated, PaymentCreate } from '@/types/api';

export function useInvoices() {
  return usePaginatedList<Invoice>(['invoices'], async (page) => {
    const { data } = await api.get<Paginated<Invoice>>('/billing/invoices', {
      params: { page, size: PAGE_SIZE },
    });
    return data;
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: async () => (await api.get<Invoice>(`/billing/invoices/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: InvoiceCreate) =>
      (await api.post<Invoice>('/billing/invoices', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/billing/invoices/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentCreate) =>
      (await api.post('/billing/payments', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
