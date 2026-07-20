import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useInvoices } from '@/api/billing';
import { PaginatedList } from '@/components/PaginatedList';
import { Badge, Card, FAB } from '@/components/ui';
import { formatMoney } from '@/utils/format';
import { colors } from '@/theme';
import type { Invoice } from '@/types/api';

export default function InvoicesScreen() {
  const query = useInvoices();

  return (
    <View style={styles.flex}>
      <PaginatedList<Invoice>
        items={query.items}
        keyExtractor={(i) => i.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        refetch={query.refetch}
        isRefetching={query.isRefetching}
        fetchNextPage={query.fetchNextPage}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        emptyMessage="No hay facturas registradas."
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/billing/[id]', params: { id: item.id } })
            }
          >
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.number}>#{item.number}</Text>
                <Badge status={item.status} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.muted}>
                  {item.items.length} ítem{item.items.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.total}>{formatMoney(item.total)}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <FAB onPress={() => router.push('/(app)/billing/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  number: { fontSize: 15, fontWeight: '800', color: colors.text },
  total: { fontSize: 16, fontWeight: '800', color: colors.primaryLight },
  muted: { fontSize: 13, color: colors.textMuted },
});
