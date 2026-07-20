import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLabOrders } from '@/api/laboratory';
import { PaginatedList } from '@/components/PaginatedList';
import { Badge, Card, FAB } from '@/components/ui';
import { colors } from '@/theme';
import type { LabOrder } from '@/types/api';

export default function LabOrdersScreen() {
  const query = useLabOrders();

  return (
    <View style={styles.flex}>
      <PaginatedList<LabOrder>
        items={query.items}
        keyExtractor={(o) => o.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        refetch={query.refetch}
        isRefetching={query.isRefetching}
        fetchNextPage={query.fetchNextPage}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        emptyMessage="No hay órdenes de laboratorio registradas."
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(app)/lab/[id]', params: { id: item.id } })}
          >
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.tests} numberOfLines={2}>
                  {item.tests || 'Orden de laboratorio'}
                </Text>
                <Badge status={item.status} />
              </View>
              {item.notes ? (
                <Text style={styles.muted} numberOfLines={1}>
                  {item.notes}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <FAB onPress={() => router.push('/(app)/lab/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  tests: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  footer: { alignItems: 'flex-end', marginTop: 4 },
});
