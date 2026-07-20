import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormTextField } from '@/components/fields';
import { Button } from '@/components/ui';
import { getErrorMessage } from '@/api/errors';
import { colors, spacing } from '@/theme';
import type { Product, ProductCreate } from '@/types/api';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  generic_name: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  min_stock: z
    .string()
    .regex(/^\d*$/, 'Debe ser un número entero')
    .optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  initial?: Product;
  submitLabel: string;
  onSubmit: (data: ProductCreate) => Promise<void>;
}

export function ProductForm({ initial, submitLabel, onSubmit }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? '',
      generic_name: initial?.generic_name ?? '',
      sku: initial?.sku ?? '',
      category: initial?.category ?? '',
      unit: initial?.unit ?? 'unidad',
      min_stock: initial ? String(initial.min_stock) : '0',
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit({
        name: values.name.trim(),
        generic_name: values.generic_name?.trim() || undefined,
        sku: values.sku?.trim() || undefined,
        category: values.category?.trim() || undefined,
        unit: values.unit.trim(),
        min_stock: values.min_stock ? Number(values.min_stock) : 0,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <FormTextField control={control} name="name" label="Nombre" />
      <FormTextField control={control} name="generic_name" label="Nombre genérico" />
      <FormTextField control={control} name="sku" label="SKU" autoCapitalize="characters" />
      <FormTextField control={control} name="category" label="Categoría" />
      <FormTextField control={control} name="unit" label="Unidad" placeholder="unidad, caja, ml…" />
      <FormTextField
        control={control}
        name="min_stock"
        label="Stock mínimo (alerta)"
        keyboardType="number-pad"
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title={submitLabel} onPress={submit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  error: { color: colors.danger, fontSize: 14, marginBottom: spacing.sm, textAlign: 'center' },
});
