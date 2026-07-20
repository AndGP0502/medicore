import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePatientStats, useRevenueReport } from '@/api/reports';
import { getErrorMessage } from '@/api/errors';
import { Card, ErrorState, LoadingState, SectionTitle } from '@/components/ui';
import { formatMoney } from '@/utils/format';
import { colors, radius, spacing } from '@/theme';

type RangeKey = '7d' | '30d' | '90d' | 'year';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeDates(key: RangeKey): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  if (key === '7d') start.setDate(end.getDate() - 7);
  else if (key === '30d') start.setDate(end.getDate() - 30);
  else if (key === '90d') start.setDate(end.getDate() - 90);
  else start.setMonth(0, 1);
  return { start: isoDate(start), end: isoDate(end) };
}

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  year: 'Este año',
};

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{formatMoney(value)}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const [range, setRange] = useState<RangeKey>('30d');
  const { start, end } = useMemo(() => rangeDates(range), [range]);

  const revenue = useRevenueReport(start, end);
  const patients = usePatientStats();

  const isLoading = revenue.isLoading || patients.isLoading;
  const isError = revenue.isError || patients.isError;

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message={getErrorMessage(revenue.error ?? patients.error)}
        onRetry={() => {
          revenue.refetch();
          patients.refetch();
        }}
      />
    );
  }

  const rev = revenue.data;
  const pat = patients.data;
  const maxRevenue = Math.max(
    rev?.total_invoiced ?? 0,
    rev?.total_collected ?? 0,
    rev?.total_pending ?? 0,
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={revenue.isRefetching || patients.isRefetching}
          onRefresh={() => {
            revenue.refetch();
            patients.refetch();
          }}
          tintColor={colors.primaryLight}
        />
      }
    >
      <View style={styles.chips}>
        {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.chip, range === key && styles.chipActive]}
            onPress={() => setRange(key)}
          >
            <Text style={[styles.chipText, range === key && styles.chipTextActive]}>
              {RANGE_LABELS[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Ingresos ({RANGE_LABELS[range]})</SectionTitle>
      <Card>
        {rev ? (
          <>
            <Bar
              label="Facturado"
              value={rev.total_invoiced}
              max={maxRevenue}
              color={colors.accent}
            />
            <Bar
              label="Cobrado"
              value={rev.total_collected}
              max={maxRevenue}
              color={colors.success}
            />
            <Bar
              label="Pendiente"
              value={rev.total_pending}
              max={maxRevenue}
              color={colors.warning}
            />
            <Text style={styles.footnote}>
              {rev.invoice_count} factura{rev.invoice_count === 1 ? '' : 's'} en el período
            </Text>
          </>
        ) : (
          <Text style={styles.footnote}>Sin datos de ingresos.</Text>
        )}
      </Card>

      <SectionTitle>Pacientes</SectionTitle>
      <Card>
        {pat ? (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pat.total_patients}</Text>
              <Text style={styles.statLabel}>Totales</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{pat.active_patients}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                +{pat.new_this_month}
              </Text>
              <Text style={styles.statLabel}>Este mes</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.footnote}>Sin datos de pacientes.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  chipText: { fontSize: 13, color: colors.textBody, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  barRow: { marginBottom: spacing.sm },
  barLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  barTrack: {
    height: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.sm },
  barValue: { fontSize: 13, fontWeight: '700', color: colors.textBody, marginTop: 2 },
  footnote: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
