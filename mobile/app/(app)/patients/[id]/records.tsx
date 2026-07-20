import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePatientRecords } from '@/api/medicalRecords';
import { PaginatedList } from '@/components/PaginatedList';
import { Card, FAB } from '@/components/ui';
import { formatDateTime } from '@/utils/format';
import { colors } from '@/theme';
import type { MedicalRecord } from '@/types/api';

export default function PatientRecordsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = usePatientRecords(id);

  return (
    <View style={styles.flex}>
      <PaginatedList<MedicalRecord>
        items={query.items}
        keyExtractor={(r) => r.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        refetch={query.refetch}
        isRefetching={query.isRefetching}
        fetchNextPage={query.fetchNextPage}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        emptyMessage="Este paciente aún no tiene consultas registradas."
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(app)/records/[recordId]', params: { recordId: item.id } })
            }
          >
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.complaint}>
                {item.chief_complaint || 'Consulta sin motivo registrado'}
              </Text>
              {item.treatment ? (
                <Text style={styles.muted} numberOfLines={1}>
                  Tratamiento: {item.treatment}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
      <FAB
        onPress={() =>
          router.push({ pathname: '/(app)/patients/[id]/new-record', params: { id: id ?? '' } })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  complaint: { fontSize: 15, color: colors.text, fontWeight: '700', marginTop: 4 },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
