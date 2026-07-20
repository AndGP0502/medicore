import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAddLot,
  useArchiveProduct,
  useProducts,
  useUpdateProduct,
} from '@/api/inventory';
import { getErrorMessage } from '@/api/errors';
import { FormTextField } from '@/components/fields';
import { Button, Card, EmptyState, InfoRow, LoadingState, SectionTitle } from '@/components/ui';
import { colors, spacing } from '@/theme';

const decimalPattern = /^\d+([.]\d+)?$/;

const lotSchema = z.object({
  lot_number: z.string().optional(),
  quantity: z
    .string()
    .min(1, 'La cantidad es requerida')
    .regex(decimalPattern, 'Debe ser un número'),
  purchase_price: z
    .string()
    .optional()
    .refine((v) => !v || decimalPattern.test(v), { message: 'Debe ser un número' }),
  sale_price: z
    .string()
    .optional()
    .refine((v) => !v || decimalPattern.test(v), { message: 'Debe ser un número' }),
  expiry_date: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'Usa el formato AAAA-MM-DD' }),
});

type LotForm = z.infer<typeof lotSchema>;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Sin GET por id en el backend: se localiza el producto en la lista paginada.
  const query = useProducts('');
  const product = query.items.find((p) => p.id === id);

  useEffect(() => {
    if (!product && query.hasNextPage && !query.isFetchingNextPage && !query.isLoading) {
      query.fetchNextPage();
    }
  }, [product, query]);

  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const addLot = useAddLot();
  const [lotError, setLotError] = useState('');
  const [lotSaved, setLotSaved] = useState(false);
  const [editingMinStock, setEditingMinStock] = useState(false);

  const { control, handleSubmit, reset } = useForm<LotForm>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lot_number: '',
      quantity: '',
      purchase_price: '',
      sale_price: '',
      expiry_date: '',
    },
  });

  const minStockForm = useForm<{ min_stock: string }>({
    defaultValues: { min_stock: product ? String(product.min_stock) : '0' },
  });

  if (query.isLoading || (!product && query.hasNextPage)) return <LoadingState />;
  if (!product) return <EmptyState message="No se encontró el producto." />;

  const confirmArchive = () => {
    Alert.alert('Desactivar producto', `¿Deseas archivar "${product.name}" del inventario?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: () =>
          archiveProduct.mutate(product.id, {
            onSuccess: () => router.back(),
            onError: (e) => Alert.alert('Error', getErrorMessage(e)),
          }),
      },
    ]);
  };

  const saveMinStock = minStockForm.handleSubmit((values) => {
    const parsed = Number(values.min_stock);
    if (!Number.isInteger(parsed) || parsed < 0) {
      Alert.alert('Error', 'El stock mínimo debe ser un entero positivo.');
      return;
    }
    updateProduct.mutate(
      { id: product.id, data: { min_stock: parsed } },
      {
        onSuccess: () => setEditingMinStock(false),
        onError: (e) => Alert.alert('Error', getErrorMessage(e)),
      },
    );
  });

  const submitLot = handleSubmit(async (values) => {
    setLotError('');
    setLotSaved(false);
    try {
      await addLot.mutateAsync({
        product_id: product.id,
        lot_number: values.lot_number?.trim() || undefined,
        quantity: Number(values.quantity),
        purchase_price: values.purchase_price ? Number(values.purchase_price) : undefined,
        sale_price: values.sale_price ? Number(values.sale_price) : undefined,
        expiry_date: values.expiry_date?.trim() || undefined,
      });
      setLotSaved(true);
      reset();
    } catch (error) {
      setLotError(getErrorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.name}>{product.name}</Text>
      {product.generic_name ? <Text style={styles.muted}>{product.generic_name}</Text> : null}

      <Card style={{ marginTop: spacing.md }}>
        <InfoRow label="SKU" value={product.sku} />
        <InfoRow label="Categoría" value={product.category} />
        <InfoRow label="Unidad" value={product.unit} />
        <InfoRow label="Stock mínimo" value={String(product.min_stock)} />
      </Card>

      {editingMinStock ? (
        <View>
          <FormTextField
            control={minStockForm.control}
            name="min_stock"
            label="Nuevo stock mínimo"
            keyboardType="number-pad"
          />
          <View style={styles.row}>
            <Button
              title="Guardar"
              onPress={saveMinStock}
              loading={updateProduct.isPending}
              style={styles.rowButton}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setEditingMinStock(false)}
              style={styles.rowButton}
            />
          </View>
        </View>
      ) : (
        <Button
          title="Editar stock mínimo"
          variant="secondary"
          onPress={() => {
            minStockForm.reset({ min_stock: String(product.min_stock) });
            setEditingMinStock(true);
          }}
        />
      )}

      <SectionTitle>Ingresar lote</SectionTitle>
      <FormTextField control={control} name="lot_number" label="Número de lote" />
      <FormTextField
        control={control}
        name="quantity"
        label="Cantidad"
        keyboardType="numeric"
      />
      <FormTextField
        control={control}
        name="purchase_price"
        label="Precio de compra ($)"
        keyboardType="numeric"
      />
      <FormTextField
        control={control}
        name="sale_price"
        label="Precio de venta ($)"
        keyboardType="numeric"
      />
      <FormTextField
        control={control}
        name="expiry_date"
        label="Fecha de caducidad (AAAA-MM-DD)"
        placeholder="2027-01-31"
      />
      {lotError ? <Text style={styles.error}>{lotError}</Text> : null}
      {lotSaved ? <Text style={styles.success}>Lote registrado correctamente.</Text> : null}
      <Button title="Registrar lote" onPress={submitLot} loading={addLot.isPending} />

      <Button
        title="Desactivar producto"
        variant="danger"
        onPress={confirmArchive}
        loading={archiveProduct.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.xs },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowButton: { flex: 1 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
  success: { color: colors.success, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
});
