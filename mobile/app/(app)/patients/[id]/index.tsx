import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeactivatePatient, usePatient } from '@/api/patients';
import { getErrorMessage } from '@/api/errors';
import {
  Button,
  Card,
  ErrorState,
  InfoRow,
  LoadingState,
  SectionTitle,
} from '@/components/ui';
import { formatDate, fullName } from '@/utils/format';
import { colors, spacing } from '@/theme';

const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);
  const deactivate = useDeactivatePatient();

  if (isLoading) return <LoadingState />;
  if (isError || !patient) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const confirmDeactivate = () => {
    Alert.alert(
      'Desactivar paciente',
      `¿Deseas archivar a ${fullName(patient)}? Podrá reactivarse desde el sistema de escritorio.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () =>
            deactivate.mutate(patient.id, {
              onSuccess: () => router.back(),
              onError: (e) => Alert.alert('Error', getErrorMessage(e)),
            }),
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{fullName(patient)}</Text>
      <Text style={styles.doc}>
        {patient.document_type === 'cedula' ? 'Cédula' : patient.document_type}:{' '}
        {patient.document_number}
      </Text>

      <View style={styles.actions}>
        <Button
          title="Historia clínica"
          onPress={() =>
            router.push({ pathname: '/(app)/patients/[id]/records', params: { id: patient.id } })
          }
          style={styles.actionButton}
        />
        <Button
          title="Editar"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/(app)/patients/[id]/edit', params: { id: patient.id } })
          }
          style={styles.actionButton}
        />
      </View>

      <SectionTitle>Datos personales</SectionTitle>
      <Card>
        <InfoRow label="Fecha de nacimiento" value={formatDate(patient.date_of_birth)} />
        <InfoRow
          label="Género"
          value={patient.gender ? (GENDER_LABELS[patient.gender] ?? patient.gender) : null}
        />
        <InfoRow label="Tipo de sangre" value={patient.blood_type} />
        <InfoRow label="Alergias" value={patient.allergies} />
      </Card>

      <SectionTitle>Contacto</SectionTitle>
      <Card>
        <InfoRow label="Teléfono" value={patient.phone} />
        <InfoRow label="Email" value={patient.email} />
        <InfoRow label="Dirección" value={patient.address} />
        <InfoRow label="Ciudad" value={patient.city} />
      </Card>

      <Button
        title="Desactivar paciente"
        variant="danger"
        onPress={confirmDeactivate}
        loading={deactivate.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  doc: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
});
