import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormSelectField, FormTextField } from '@/components/fields';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/api/errors';
import { colors, spacing } from '@/theme';
import type { Patient, PatientCreate } from '@/types/api';

const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const patientSchema = z.object({
  document_type: z.string().min(1, 'Requerido'),
  document_number: z.string().min(4, 'Mínimo 4 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  date_of_birth: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v.trim()), {
      message: 'Usa el formato AAAA-MM-DD',
    })
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  gender: optionalText,
  blood_type: optionalText,
  email: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === '' || z.string().email().safeParse(v.trim()).success, {
      message: 'Email inválido',
    })
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  phone: optionalText,
  address: optionalText,
  city: optionalText,
  allergies: optionalText,
  notes: optionalText,
});

export type PatientFormValues = z.input<typeof patientSchema>;

interface Props {
  initial?: Patient;
  submitLabel: string;
  onSubmit: (data: PatientCreate) => Promise<void>;
}

export function PatientForm({ initial, submitLabel, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      document_type: initial?.document_type ?? 'cedula',
      document_number: initial?.document_number ?? '',
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      date_of_birth: initial?.date_of_birth ?? '',
      gender: initial?.gender ?? '',
      blood_type: initial?.blood_type ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      allergies: initial?.allergies ?? '',
      notes: '',
    },
  });

  const submit = handleSubmit(async (raw) => {
    const values = patientSchema.parse(raw);
    setSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit(values);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <FormSelectField
        control={control}
        name="document_type"
        label="Tipo de documento"
        options={[
          { label: 'Cédula', value: 'cedula' },
          { label: 'Pasaporte', value: 'pasaporte' },
          { label: 'RUC', value: 'ruc' },
        ]}
      />
      <FormTextField
        control={control}
        name="document_number"
        label="Número de documento"
        keyboardType="number-pad"
      />
      <FormTextField control={control} name="first_name" label="Nombres" />
      <FormTextField control={control} name="last_name" label="Apellidos" />
      <FormTextField
        control={control}
        name="date_of_birth"
        label="Fecha de nacimiento (AAAA-MM-DD)"
        placeholder="1990-05-20"
      />
      <FormSelectField
        control={control}
        name="gender"
        label="Género"
        options={[
          { label: 'Masculino', value: 'male' },
          { label: 'Femenino', value: 'female' },
          { label: 'Otro', value: 'other' },
        ]}
      />
      <FormSelectField
        control={control}
        name="blood_type"
        label="Tipo de sangre"
        options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => ({
          label: t,
          value: t,
        }))}
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FormTextField control={control} name="phone" label="Teléfono" keyboardType="phone-pad" />
      <FormTextField control={control} name="address" label="Dirección" />
      <FormTextField control={control} name="city" label="Ciudad" />
      <FormTextField control={control} name="allergies" label="Alergias" multiline />
      <FormTextField control={control} name="notes" label="Notas" multiline />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title={submitLabel} onPress={submit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
