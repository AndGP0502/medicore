import React from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, RefreshControl, View } from 'react-native';
import { getErrorMessage } from '@/api/errors';
import { colors, spacing } from '@/theme';
import { EmptyState, ErrorState, LoadingState } from './ui';

interface Props<T> {
  items: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isRefetching: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  emptyMessage: string;
  header?: React.ReactElement;
}

/** FlatList con estados de carga/error/vacío y paginación infinita. */
export function PaginatedList<T>({
  items,
  renderItem,
  keyExtractor,
  isLoading,
  isError,
  error,
  refetch,
  isRefetching,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  emptyMessage,
  header,
}: Props<T>) {
  if (isLoading) return <LoadingState />;
  if (isError && items.length === 0) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 96, flexGrow: 1 }}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState message={emptyMessage} />}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={colors.primaryLight}
        />
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: spacing.md }}>
            <ActivityIndicator color={colors.primaryLight} />
          </View>
        ) : null
      }
    />
  );
}
