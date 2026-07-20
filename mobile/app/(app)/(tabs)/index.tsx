import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useDashboard } from '@/api/reports';
import { getErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/auth';
import { Badge, Card, ErrorState, LoadingState, SectionTitle, StatTile } from '@/components/ui';
import { formatMoney, formatTime, fullName } from '@/utils/format';
import { colors, spacing } from '@/theme';

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primaryLight}
        />
      }
    >
      <Text style={styles.greeting}>Hola, {user?.full_name ?? 'usuario'}</Text>
      <Text style={styles.greetingSub}>Resumen de hoy en tu consultorio</Text>

      <View style={styles.grid}>
        <StatTile label="Citas hoy" value={String(data.citas_hoy)} icon="calendar" />
        <StatTile
          label="Atendidos hoy"
          value={String(data.atendidos_hoy)}
          icon="checkmark-done"
          tint={colors.success}
        />
        <StatTile
          label="Ingresos hoy"
          value={formatMoney(data.ingresos_hoy)}
          icon="cash"
          tint={colors.success}
        />
        <StatTile
          label="Ingresos del mes"
          value={formatMoney(data.ingresos_mes)}
          icon="trending-up"
          tint={colors.accent}
        />
        <StatTile label="Pacientes" value={String(data.total_pacientes)} icon="people" />
        <StatTile
          label="Nuevos este mes"
          value={String(data.nuevos_mes)}
          icon="person-add"
          tint={colors.accent}
        />
        <StatTile
          label="Facturas pendientes"
          value={String(data.facturas_pendientes)}
          icon="document-text"
          tint={colors.warning}
        />
        <StatTile
          label="Stock bajo"
          value={String(data.productos_stock_bajo)}
          icon="alert-circle"
          tint={colors.danger}
        />
      </View>

      <SectionTitle>Citas de hoy</SectionTitle>
      {data.citas_hoy_lista.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No hay citas agendadas para hoy.</Text>
        </Card>
      ) : (
        data.citas_hoy_lista.map((cita) => (
          <Card key={cita.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{formatTime(cita.scheduled_at)}</Text>
              <Badge status={cita.status} />
            </View>
            <Text style={styles.cardBody}>{cita.reason || 'Sin motivo registrado'}</Text>
            <Text style={styles.cardMuted}>{cita.duration_minutes} min</Text>
          </Card>
        ))
      )}

      <SectionTitle>Últimos pacientes</SectionTitle>
      {data.ultimos_pacientes.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Aún no hay pacientes registrados.</Text>
        </Card>
      ) : (
        data.ultimos_pacientes.map((p) => (
          <Card key={p.id} style={styles.patientCard}>
            <View style={styles.rowBetween}>
              <Text
                style={styles.cardTitle}
                onPress={() => router.push({ pathname: '/(app)/patients/[id]', params: { id: p.id } })}
              >
                {fullName(p)}
              </Text>
              <Text style={styles.cardMuted}>{p.document_number}</Text>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  greetingSub: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardBody: { fontSize: 14, color: colors.textBody, marginTop: 4 },
  cardMuted: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  patientCard: { paddingVertical: 12 },
});
