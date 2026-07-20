import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppointments, useUpdateAppointment } from '@/api/appointments';
import { useDoctors } from '@/api/auth';
import { getErrorMessage } from '@/api/errors';
import { PaginatedList } from '@/components/PaginatedList';
import { Badge, Card, FAB } from '@/components/ui';
import { formatDateTime, fullName } from '@/utils/format';
import { colors, spacing, statusLabels } from '@/theme';
import type { Appointment, AppointmentStatus } from '@/types/api';

const STATUS_FILTERS: (AppointmentStatus | 'all')[] = [
  'all',
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

// Transiciones razonables de estado para ofrecer en el menu contextual.
const NEXT_STATUSES: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'in_progress', 'cancelled', 'no_show'],
  confirmed: ['in_progress', 'completed', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export default function AppointmentsScreen() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string | undefined>(undefined);
  const { data: doctors } = useDoctors();
  const query = useAppointments(doctorFilter);
  const updateAppointment = useUpdateAppointment();

  // El backend solo filtra por doctor; el filtro por estado se aplica en cliente.
  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? query.items
        : query.items.filter((a) => a.status === statusFilter),
    [query.items, statusFilter],
  );

  const changeStatus = (appointment: Appointment) => {
    const options = NEXT_STATUSES[appointment.status];
    if (options.length === 0) {
      Alert.alert('Cita', 'Esta cita ya no admite cambios de estado.');
      return;
    }
    Alert.alert(
      'Cambiar estado',
      `Cita del ${formatDateTime(appointment.scheduled_at)}`,
      [
        ...options.map((status) => ({
          text: statusLabels[status] ?? status,
          onPress: () =>
            updateAppointment.mutate(
              { id: appointment.id, data: { status } },
              { onError: (e) => Alert.alert('Error', getErrorMessage(e)) },
            ),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  return (
    <View style={styles.flex}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {STATUS_FILTERS.map((status) => (
            <Pressable
              key={status}
              style={[styles.chip, statusFilter === status && styles.chipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[styles.chipText, statusFilter === status && styles.chipTextActive]}
              >
                {status === 'all' ? 'Todas' : statusLabels[status]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {doctors && doctors.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <Pressable
              style={[styles.chip, !doctorFilter && styles.chipActive]}
              onPress={() => setDoctorFilter(undefined)}
            >
              <Text style={[styles.chipText, !doctorFilter && styles.chipTextActive]}>
                Todos los doctores
              </Text>
            </Pressable>
            {doctors.map((doctor) => (
              <Pressable
                key={doctor.id}
                style={[styles.chip, doctorFilter === doctor.id && styles.chipActive]}
                onPress={() => setDoctorFilter(doctor.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    doctorFilter === doctor.id && styles.chipTextActive,
                  ]}
                >
                  {doctor.full_name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <PaginatedList<Appointment>
        items={filtered}
        keyExtractor={(a) => a.id}
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        refetch={query.refetch}
        isRefetching={query.isRefetching}
        fetchNextPage={query.fetchNextPage}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        emptyMessage="No hay citas para los filtros seleccionados."
        renderItem={({ item }) => (
          <Pressable onPress={() => changeStatus(item)}>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.when}>{formatDateTime(item.scheduled_at)}</Text>
                <Badge status={item.status} />
              </View>
              <Text style={styles.patient}>
                {item.patient ? fullName(item.patient) : 'Paciente'}
                {item.patient ? ` · ${item.patient.document_number}` : ''}
              </Text>
              {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
              <Text style={styles.muted}>{item.duration_minutes} min · toca para cambiar estado</Text>
            </Card>
          </Pressable>
        )}
      />

      <FAB onPress={() => router.push('/(app)/appointments/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  chipText: { fontSize: 13, color: colors.textBody, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  when: { fontSize: 15, fontWeight: '700', color: colors.text },
  patient: { fontSize: 14, color: colors.textBody, marginTop: 4, fontWeight: '600' },
  reason: { fontSize: 14, color: colors.textBody, marginTop: 2 },
  muted: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
