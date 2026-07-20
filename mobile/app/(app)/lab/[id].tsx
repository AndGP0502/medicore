import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAddLabResult,
  useArchiveLabOrder,
  useLabOrders,
  useUpdateLabOrder,
} from '@/api/laboratory';
import { getErrorMessage } from '@/api/errors';
import { FormSelectField, FormTextField } from '@/components/fields';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  SectionTitle,
} from '@/components/ui';
import { colors, spacing, statusLabels } from '@/theme';
import type { LabOrderStatus } from '@/types/api';

const resultSchema = z.object({
  test_name: z.string().min(1, 'El nombre del examen es requerido'),
  value: z.string().optional(),
  unit: z.string().optional(),
  reference_range: z.string().optional(),
  is_abnormal: z.string().optional(),
});

type ResultForm = z.infer<typeof resultSchema>;

const STATUS_OPTIONS: LabOrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];

export default function LabOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // El backend no expone GET /laboratory/orders/{id}: se localiza la orden
  // dentro de la lista paginada, avanzando páginas hasta encontrarla.
  const query = useLabOrders();
  const order = query.items.find((o) => o.id === id);

  useEffect(() => {
    if (!order && query.hasNextPage && !query.isFetchingNextPage && !query.isLoading) {
      query.fetchNextPage();
    }
  }, [order, query]);

  const updateOrder = useUpdateLabOrder();
  const archiveOrder = useArchiveLabOrder();
  const addResult = useAddLabResult();
  const [errorMessage, setErrorMessage] = useState('');
  const [savedResults, setSavedResults] = useState<string[]>([]);

  const { control, handleSubmit, reset } = useForm<ResultForm>({
    resolver: zodResolver(resultSchema),
    defaultValues: { test_name: '', value: '', unit: '', reference_range: '', is_abnormal: 'no' },
  });

  if (query.isLoading || (!order && query.hasNextPage)) return <LoadingState />;
  if (!order) return <EmptyState message="No se encontró la orden de laboratorio." />;

  const changeStatus = () => {
    Alert.alert('Cambiar estado', 'Selecciona el nuevo estado de la orden', [
      ...STATUS_OPTIONS.filter((s) => s !== order.status).map((status) => ({
        text: statusLabels[status] ?? status,
        onPress: () =>
          updateOrder.mutate(
            { id: order.id, data: { status } },
            { onError: (e) => Alert.alert('Error', getErrorMessage(e)) },
          ),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const confirmArchive = () => {
    Alert.alert('Archivar orden', '¿Deseas archivar esta orden de laboratorio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Archivar',
        style: 'destructive',
        onPress: () =>
          archiveOrder.mutate(order.id, {
            onSuccess: () => router.back(),
            onError: (e) => Alert.alert('Error', getErrorMessage(e)),
          }),
      },
    ]);
  };

  const submitResult = handleSubmit(async (values) => {
    setErrorMessage('');
    try {
      await addResult.mutateAsync({
        order_id: order.id,
        test_name: values.test_name.trim(),
        value: values.value?.trim() || undefined,
        unit: values.unit?.trim() || undefined,
        reference_range: values.reference_range?.trim() || undefined,
        is_abnormal: values.is_abnormal || 'no',
      });
      setSavedResults((prev) => [...prev, values.test_name.trim()]);
      reset({ test_name: '', value: '', unit: '', reference_range: '', is_abnormal: 'no' });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Card>
        <Badge status={order.status} />
        <Text style={styles.tests}>{order.tests || 'Orden de laboratorio'}</Text>
        {order.notes ? <Text style={styles.notes}>{order.notes}</Text> : null}
      </Card>

      <Button
        title="Cambiar estado"
        variant="secondary"
        onPress={changeStatus}
        loading={updateOrder.isPending}
      />

      <SectionTitle>Registrar resultado</SectionTitle>
      <Text style={styles.hint}>
        Al guardar un resultado, la orden pasa automáticamente a estado Completada.
      </Text>
      <FormTextField control={control} name="test_name" label="Examen" placeholder="Glucosa" />
      <FormTextField control={control} name="value" label="Valor" placeholder="92" />
      <FormTextField control={control} name="unit" label="Unidad" placeholder="mg/dL" />
      <FormTextField
        control={control}
        name="reference_range"
        label="Rango de referencia"
        placeholder="70 - 110"
      />
      <FormSelectField
        control={control}
        name="is_abnormal"
        label="¿Resultado anormal?"
        options={[
          { label: 'No', value: 'no' },
          { label: 'Sí', value: 'si' },
        ]}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Guardar resultado" onPress={submitResult} loading={addResult.isPending} />

      {savedResults.length > 0 ? (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.savedTitle}>Resultados guardados en esta sesión:</Text>
          {savedResults.map((name, i) => (
            <Text key={`${name}-${i}`} style={styles.savedItem}>
              ✓ {name}
            </Text>
          ))}
        </Card>
      ) : null}

      <Button
        title="Archivar orden"
        variant="danger"
        onPress={confirmArchive}
        loading={archiveOrder.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.sm },
  tests: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  notes: { fontSize: 14, color: colors.textBody, marginTop: 4 },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
  savedTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  savedItem: { fontSize: 14, color: colors.success, marginTop: 2 },
});
