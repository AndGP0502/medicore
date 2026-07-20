import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useArchiveMedicalRecord, useMedicalRecord } from '@/api/medicalRecords';
import { useSummarizeHistory } from '@/api/ai';
import { getErrorMessage } from '@/api/errors';
import {
  Button,
  Card,
  ErrorState,
  InfoRow,
  LoadingState,
  SectionTitle,
} from '@/components/ui';
import { formatDateTime } from '@/utils/format';
import { colors, spacing } from '@/theme';

function entriesToText(entries?: Record<string, unknown>[] | null): string {
  if (!entries || entries.length === 0) return '—';
  return entries
    .map((e) => String(e.description ?? e.name ?? JSON.stringify(e)))
    .join('\n');
}

export default function RecordDetailScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  const { data: record, isLoading, isError, error, refetch } = useMedicalRecord(recordId);
  const archive = useArchiveMedicalRecord();
  const summarize = useSummarizeHistory();
  const [summary, setSummary] = useState('');

  if (isLoading) return <LoadingState />;
  if (isError || !record) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const vitals = record.vital_signs ?? {};
  const vitalLabels: Record<string, string> = {
    blood_pressure: 'Presión arterial',
    heart_rate: 'Frecuencia cardíaca',
    temperature: 'Temperatura',
    weight: 'Peso',
  };

  const confirmArchive = () => {
    Alert.alert('Archivar consulta', '¿Deseas archivar este registro clínico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        style: 'destructive',
        onPress: () =>
          archive.mutate(record.id, {
            onSuccess: () => router.back(),
            onError: (e) => Alert.alert('Error', getErrorMessage(e)),
          }),
      },
    ]);
  };

  const requestSummary = () => {
    summarize.mutate([record], {
      onSuccess: (data) => setSummary(data.response),
      onError: (e) => Alert.alert('Error', getErrorMessage(e)),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{formatDateTime(record.created_at)}</Text>
      <Text style={styles.title}>{record.chief_complaint || 'Consulta médica'}</Text>

      <SectionTitle>Anamnesis</SectionTitle>
      <Card>
        <Text style={styles.body}>{record.anamnesis || '—'}</Text>
      </Card>

      <SectionTitle>Signos vitales</SectionTitle>
      <Card>
        {Object.keys(vitals).length === 0 ? (
          <Text style={styles.body}>—</Text>
        ) : (
          Object.entries(vitals).map(([key, value]) => (
            <InfoRow key={key} label={vitalLabels[key] ?? key} value={String(value)} />
          ))
        )}
      </Card>

      <SectionTitle>Examen físico</SectionTitle>
      <Card>
        <Text style={styles.body}>{record.physical_exam || '—'}</Text>
      </Card>

      <SectionTitle>Diagnósticos</SectionTitle>
      <Card>
        <Text style={styles.body}>{entriesToText(record.diagnosis)}</Text>
      </Card>

      <SectionTitle>Tratamiento</SectionTitle>
      <Card>
        <Text style={styles.body}>{record.treatment || '—'}</Text>
      </Card>

      <SectionTitle>Prescripciones</SectionTitle>
      <Card>
        <Text style={styles.body}>{entriesToText(record.prescriptions)}</Text>
      </Card>

      {record.notes ? (
        <>
          <SectionTitle>Notas</SectionTitle>
          <Card>
            <Text style={styles.body}>{record.notes}</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle>Resumen con IA</SectionTitle>
      {summary ? (
        <Card>
          <Text style={styles.body}>{summary}</Text>
          <Text style={styles.disclaimer}>
            Sugerencia generada por IA como apoyo. No sustituye el criterio médico.
          </Text>
        </Card>
      ) : null}
      <Button
        title={summary ? 'Regenerar resumen' : 'Resumir con IA'}
        variant="secondary"
        onPress={requestSummary}
        loading={summarize.isPending}
      />

      <Button
        title="Archivar consulta"
        variant="danger"
        onPress={confirmArchive}
        loading={archive.isPending}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  date: { fontSize: 13, color: colors.textMuted },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 2 },
  body: { fontSize: 14, color: colors.textBody, lineHeight: 20 },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
