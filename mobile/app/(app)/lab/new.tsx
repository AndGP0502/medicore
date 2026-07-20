import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLabOrder } from '@/api/laboratory';
import { getErrorMessage } from '@/api/errors';
import { FormTextField } from '@/components/fields';
import { DoctorPickerField, PatientPickerField } from '@/components/pickers';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

const labOrderSchema = z.object({
  patient_id: z.string().min(1, 'Selecciona el paciente'),
  doctor_id: z.string().min(1, 'Selecciona el doctor'),
  tests: z.string().min(1, 'Indica los exámenes solicitados'),
  notes: z.string().optional(),
});

type LabOrderForm = z.infer<typeof labOrderSchema>;

export default function NewLabOrderScreen() {
  const createOrder = useCreateLabOrder();
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<LabOrderForm>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: { patient_id: '', doctor_id: '', tests: '', notes: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('');
    try {
      await createOrder.mutateAsync({
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        tests: values.tests.trim(),
        notes: values.notes?.trim() || undefined,
      });
      router.back();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <PatientPickerField control={control} name="patient_id" label="Paciente" />
      <DoctorPickerField control={control} name="doctor_id" label="Doctor solicitante" />
      <FormTextField
        control={control}
        name="tests"
        label="Exámenes solicitados"
        placeholder="Hemograma completo, glucosa en ayunas…"
        multiline
      />
      <FormTextField control={control} name="notes" label="Notas" multiline />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Crear orden" onPress={onSubmit} loading={createOrder.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm, textAlign: 'center' },
});
