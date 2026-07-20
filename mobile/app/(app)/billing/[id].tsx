import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddPayment, useCancelInvoice, useInvoice } from '@/api/billing';
import { getErrorMessage } from '@/api/errors';
import { FormSelectField, FormTextField } from '@/components/fields';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  SectionTitle,
} from '@/components/ui';
import { formatMoney, num } from '@/utils/format';
import { colors, spacing } from '@/theme';
import type { PaymentMethod } from '@/types/api';

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, 'El monto es requerido')
    .regex(/^\d+([.]\d+)?$/, 'Debe ser un número'),
  method: z.enum(['cash', 'card', 'transfer', 'insurance']),
  reference: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id);
  const addPayment = useAddPayment();
  const cancelInvoice = useCancelInvoice();
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaved, setPaymentSaved] = useState(false);

  const { control, handleSubmit, reset } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: '', method: 'cash', reference: '' },
  });

  if (isLoading) return <LoadingState />;
  if (isError || !invoice) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const canPay = invoice.status === 'pending' || invoice.status === 'partial';

  const submitPayment = handleSubmit(async (values) => {
    setPaymentError('');
    setPaymentSaved(false);
    try {
      await addPayment.mutateAsync({
        invoice_id: invoice.id,
        amount: Number(values.amount),
        method: values.method as PaymentMethod,
        reference: values.reference?.trim() || undefined,
      });
      setPaymentSaved(true);
      reset({ amount: '', method: 'cash', reference: '' });
      refetch();
    } catch (err) {
      setPaymentError(getErrorMessage(err));
    }
  });

  const confirmCancel = () => {
    Alert.alert(
      'Anular factura',
      `¿Deseas anular la factura #${invoice.number}? Quedará archivada en el sistema.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: () =>
            cancelInvoice.mutate(invoice.id, {
              onSuccess: () => router.back(),
              onError: (e) => Alert.alert('Error', getErrorMessage(e)),
            }),
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.number}>Factura #{invoice.number}</Text>
        <Badge status={invoice.status} />
      </View>

      <SectionTitle>Detalle</SectionTitle>
      {invoice.items.map((item) => (
        <Card key={item.id}>
          <Text style={styles.itemDesc}>{item.description}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>
              {num(item.quantity)} × {formatMoney(item.unit_price)} · IVA{' '}
              {num(item.iva_porcentaje)}%
            </Text>
            <Text style={styles.itemTotal}>{formatMoney(item.total)}</Text>
          </View>
        </Card>
      ))}

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatMoney(invoice.subtotal)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>IVA</Text>
          <Text style={styles.totalValue}>{formatMoney(invoice.tax)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatMoney(invoice.total)}</Text>
        </View>
      </Card>

      {invoice.notes ? (
        <Card>
          <Text style={styles.muted}>{invoice.notes}</Text>
        </Card>
      ) : null}

      {canPay ? (
        <>
          <SectionTitle>Registrar pago</SectionTitle>
          <FormTextField
            control={control}
            name="amount"
            label="Monto ($)"
            keyboardType="numeric"
            placeholder={String(num(invoice.total))}
          />
          <FormSelectField
            control={control}
            name="method"
            label="Método de pago"
            options={[
              { label: 'Efectivo', value: 'cash' },
              { label: 'Tarjeta', value: 'card' },
              { label: 'Transferencia', value: 'transfer' },
              { label: 'Seguro', value: 'insurance' },
            ]}
          />
          <FormTextField
            control={control}
            name="reference"
            label="Referencia (opcional)"
            placeholder="N° comprobante"
          />
          {paymentError ? <Text style={styles.error}>{paymentError}</Text> : null}
          {paymentSaved ? (
            <Text style={styles.success}>Pago registrado correctamente.</Text>
          ) : null}
          <Button
            title="Registrar pago"
            onPress={submitPayment}
            loading={addPayment.isPending}
          />
        </>
      ) : null}

      {invoice.status !== 'cancelled' ? (
        <Button
          title="Anular factura"
          variant="danger"
          onPress={confirmCancel}
          loading={cancelInvoice.isPending}
          style={{ marginTop: spacing.lg }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: { fontSize: 20, fontWeight: '800', color: colors.text },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemDesc: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.textBody },
  muted: { fontSize: 13, color: colors.textMuted },
  totalValue: { fontSize: 14, color: colors.textBody, fontWeight: '600' },
  grandLabel: { fontSize: 16, color: colors.text, fontWeight: '800' },
  grandValue: { fontSize: 16, color: colors.primaryLight, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
  success: { color: colors.success, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
});
