import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAppointment } from '@/api/appointments';
import { getErrorMessage } from '@/api/errors';
import { FormSelectField, FormTextField } from '@/components/fields';
import { DoctorPickerField, PatientPickerField } from '@/components/pickers';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Selecciona el paciente'),
  doctor_id: z.string().min(1, 'Selecciona el doctor'),
  date: z
    .string()
    .min(1, 'La fecha es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD'),
  time: z
    .string()
    .min(1, 'La hora es requerida')
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM (24h)'),
  duration_minutes: z.string().min(1, 'Requerido'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function NewAppointmentScreen() {
  const createAppointment = useCreateAppointment();
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: '',
      doctor_id: '',
      date: '',
      time: '',
      duration_minutes: '30',
      reason: '',
      notes: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage('');
    try {
      await createAppointment.mutateAsync({
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        scheduled_at: `${values.date}T${values.time}:00`,
        duration_minutes: values.duration_minutes,
        reason: values.reason?.trim() || undefined,
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
      <DoctorPickerField control={control} name="doctor_id" label="Doctor" />
      <FormTextField
        control={control}
        name="date"
        label="Fecha (AAAA-MM-DD)"
        placeholder="2026-07-25"
      />
      <FormTextField control={control} name="time" label="Hora (HH:MM)" placeholder="09:30" />
      <FormSelectField
        control={control}
        name="duration_minutes"
        label="Duración"
        options={[
          { label: '15 minutos', value: '15' },
          { label: '30 minutos', value: '30' },
          { label: '45 minutos', value: '45' },
          { label: '60 minutos', value: '60' },
        ]}
      />
      <FormTextField control={control} name="reason" label="Motivo" multiline />
      <FormTextField control={control} name="notes" label="Notas" multiline />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Agendar cita" onPress={onSubmit} loading={createAppointment.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm, textAlign: 'center' },
});
