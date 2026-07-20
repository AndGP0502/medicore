import { useInfiniteQuery } from '@tanstack/react-query';
import type { Paginated } from '@/types/api';

export const PAGE_SIZE = 20;

/**
 * Hook generico para listas paginadas del backend ({items,total,page,size,pages}).
 * Devuelve los items aplanados y soporta scroll infinito.
 */
export function usePaginatedList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number) => Promise<Paginated<T>>,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const items: T[] = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, items, total };
}
