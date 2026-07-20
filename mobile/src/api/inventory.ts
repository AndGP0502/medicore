import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PAGE_SIZE, usePaginatedList } from './pagination';
import type { LotCreate, Paginated, Product, ProductCreate, ProductUpdate } from '@/types/api';

export function useProducts(search: string) {
  return usePaginatedList<Product>(['products', search], async (page) => {
    const { data } = await api.get<Paginated<Product>>('/inventory/products', {
      params: { search, page, size: PAGE_SIZE },
    });
    return data;
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductCreate) =>
      (await api.post<Product>('/inventory/products', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductUpdate }) =>
      (await api.put<Product>(`/inventory/products/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useAddLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: LotCreate) => (await api.post('/inventory/lots', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
