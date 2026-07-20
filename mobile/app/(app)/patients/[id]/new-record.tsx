import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMedicalRecord } from '@/api/medicalRecords';
import { getErrorMessage } from '@/api/errors';
import { FormTextField } from '@/components/fields';
import { DoctorPickerField } from '@/components/pickers';
import { Button, SectionTitle } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { MedicalRecordCreate } from '@/types/api';

const recordSchema = z.object({
  doctor_id: z.string().min(1, 'Selecciona el doctor'),
  chief_complaint: z.string().optional(),
  anamnesis: z.string().optional(),
  physical_exam: z.string().optional(),
  diagnosis_text: z.string().optional(),
  treatment: z.string().optional(),
  prescriptions_text: z.string().optional(),
  notes: z.string().optional(),
  // Signos vitales como campos simples
  blood_pressure: z.string().optional(),
  heart_rate: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
});

type RecordForm = z.infer<typeof recordSchema>;

export default function NewRecordScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const createRecord = useCreateMedicalRecord();
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      doctor_id: '',
      chief_complaint: '',
      anamnesis: '',
      physical_exam: '',
      diagnosis_text: '',
      treatment: '',
      prescriptions_text: '',
      notes: '',
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      weight: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('');
    const vitalSigns: Record<string, string> = {};
    if (values.blood_pressure?.trim()) vitalSigns.blood_pressure = values.blood_pressure.trim();
    if (values.heart_rate?.trim()) vitalSigns.heart_rate = values.heart_rate.trim();
    if (values.temperature?.trim()) vitalSigns.temperature = values.temperature.trim();
    if (values.weight?.trim()) vitalSigns.weight = values.weight.trim();

    // diagnosis y prescriptions son listas de objetos en el backend;
    // cada linea del texto se convierte en una entrada {description}.
    const toEntries = (text?: string) =>
      text
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ description: line })) ?? [];

    const payload: MedicalRecordCreate = {
      patient_id: patientId ?? '',
      doctor_id: values.doctor_id,
      chief_complaint: values.chief_complaint?.trim() || undefined,
      anamnesis: values.anamnesis?.trim() || undefined,
      vital_signs: Object.keys(vitalSigns).length ? vitalSigns : undefined,
      physical_exam: values.physical_exam?.trim() || undefined,
      diagnosis: toEntries(values.diagnosis_text),
      treatment: values.treatment?.trim() || undefined,
      prescriptions: toEntries(values.prescriptions_text),
      notes: values.notes?.trim() || undefined,
    };

    try {
      await createRecord.mutateAsync(payload);
      router.back();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <DoctorPickerField control={control} name="doctor_id" label="Doctor" />
      <FormTextField control={control} name="chief_complaint" label="Motivo de consulta" />
      <FormTextField control={control} name="anamnesis" label="Anamnesis" multiline />

      <SectionTitle>Signos vitales</SectionTitle>
      <FormTextField
        control={control}
        name="blood_pressure"
        label="Presión arterial"
        placeholder="120/80"
      />
      <FormTextField
        control={control}
        name="heart_rate"
        label="Frecuencia cardíaca (lpm)"
        keyboardType="numeric"
      />
      <FormTextField
        control={control}
        name="temperature"
        label="Temperatura (°C)"
        keyboardType="numeric"
      />
      <FormTextField control={control} name="weight" label="Peso (kg)" keyboardType="numeric" />

      <SectionTitle>Evaluación</SectionTitle>
      <FormTextField control={control} name="physical_exam" label="Examen físico" multiline />
      <FormTextField
        control={control}
        name="diagnosis_text"
        label="Diagnósticos (uno por línea)"
        multiline
      />
      <FormTextField control={control} name="treatment" label="Tratamiento" multiline />
      <FormTextField
        control={control}
        name="prescriptions_text"
        label="Prescripciones (una por línea)"
        multiline
      />
      <FormTextField control={control} name="notes" label="Notas" multiline />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Guardar consulta" onPress={onSubmit} loading={createRecord.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm, textAlign: 'center' },
});
