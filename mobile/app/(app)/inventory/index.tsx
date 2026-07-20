import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/api/inventory';
import { PaginatedList } from '@/components/PaginatedList';
import { Card, FAB } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { Product } from '@/types/api';

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const query = useProducts(debounced);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto…"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <PaginatedList<Product>
        items={query.items}
        keyExtractor={(p) => p.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        refetch={query.refetch}
        isRefetching={query.isRefetching}
        fetchNextPage={query.fetchNextPage}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        emptyMessage="No hay productos en el inventario."
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/inventory/[id]', params: { id: item.id } })
            }
          >
            <Card>
              <View style={styles.rowBetween}>
                <View style={styles.flexShrink}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.generic_name ? (
                    <Text style={styles.muted}>{item.generic_name}</Text>
                  ) : null}
                  <Text style={styles.muted}>
                    {item.category ? `${item.category} · ` : ''}
                    {item.unit}
                    {item.sku ? ` · SKU ${item.sku}` : ''}
                  </Text>
                </View>
                <View style={styles.stockBadge}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                  <Text style={styles.stockText}>Mín: {item.min_stock}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <FAB onPress={() => router.push('/(app)/inventory/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.textBody },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flexShrink: { flexShrink: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}15`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockText: { fontSize: 12, color: colors.warning, fontWeight: '700' },
});
