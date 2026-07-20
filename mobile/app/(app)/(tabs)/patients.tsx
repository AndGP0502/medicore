import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePatients } from '@/api/patients';
import { PaginatedList } from '@/components/PaginatedList';
import { Card, FAB } from '@/components/ui';
import { fullName } from '@/utils/format';
import { colors, radius, spacing } from '@/theme';
import type { Patient } from '@/types/api';

export default function PatientsScreen() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const query = usePatients(debounced);

  React.useEffect(() => {
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
          placeholder="Buscar por nombre o cédula…"
          placeholderTextColor={colors.textMuted}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <PaginatedList<Patient>
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
        emptyMessage={
          debounced ? 'No se encontraron pacientes con esa búsqueda.' : 'Aún no hay pacientes registrados.'
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/patients/[id]', params: { id: item.id } })
            }
          >
            <Card>
              <View style={styles.rowBetween}>
                <View style={styles.flexShrink}>
                  <Text style={styles.name}>{fullName(item)}</Text>
                  <Text style={styles.muted}>
                    {item.document_type === 'cedula' ? 'Cédula' : item.document_type}:{' '}
                    {item.document_number}
                  </Text>
                  {item.phone ? <Text style={styles.muted}>Tel: {item.phone}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        )}
      />

      <FAB onPress={() => router.push('/(app)/patients/new')} />
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
  },
  flexShrink: { flexShrink: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
