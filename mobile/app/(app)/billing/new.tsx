import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useCreateInvoice } from '@/api/billing';
import { getErrorMessage } from '@/api/errors';
import { FormSelectField, FormTextField } from '@/components/fields';
import { PatientPickerField } from '@/components/pickers';
import { Button, Card, SectionTitle } from '@/components/ui';
import { formatMoney } from '@/utils/format';
import { colors, spacing } from '@/theme';
import type { InvoiceItemCreate } from '@/types/api';

const decimalPattern = /^\d+([.]\d+)?$/;

const invoiceSchema = z.object({
  patient_id: z.string().min(1, 'Selecciona el paciente'),
  notes: z.string().optional(),
});

const itemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z
    .string()
    .min(1, 'Requerida')
    .regex(decimalPattern, 'Debe ser un número'),
  unit_price: z
    .string()
    .min(1, 'Requerido')
    .regex(decimalPattern, 'Debe ser un número'),
  // El backend solo acepta IVA 0 (servicios médicos) o 15 (tarifa general).
  iva_porcentaje: z.enum(['0', '15']),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;
type ItemForm = z.infer<typeof itemSchema>;

export default function NewInvoiceScreen() {
  const createInvoice = useCreateInvoice();
  const [items, setItems] = useState<InvoiceItemCreate[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const invoiceForm = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { patient_id: '', notes: '' },
  });

  const itemForm = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { description: '', quantity: '1', unit_price: '', iva_porcentaje: '0' },
  });

  const addItem = itemForm.handleSubmit((values) => {
    setItems((prev) => [
      ...prev,
      {
        description: values.description.trim(),
        quantity: Number(values.quantity),
        unit_price: Number(values.unit_price),
        iva_porcentaje: Number(values.iva_porcentaje),
      },
    ]);
    itemForm.reset({ description: '', quantity: '1', unit_price: '', iva_porcentaje: '0' });
  });

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
  const tax = items.reduce(
    (acc, it) => acc + (it.quantity * it.unit_price * it.iva_porcentaje) / 100,
    0,
  );

  const onSubmit = invoiceForm.handleSubmit(async (values) => {
    setErrorMessage('');
    if (items.length === 0) {
      setErrorMessage('Agrega al menos un ítem a la factura.');
      return;
    }
    try {
      const invoice = await createInvoice.mutateAsync({
        patient_id: values.patient_id,
        items,
        notes: values.notes?.trim() || undefined,
      });
      router.replace({ pathname: '/(app)/billing/[id]', params: { id: invoice.id } });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <PatientPickerField control={invoiceForm.control} name="patient_id" label="Paciente" />
      <FormTextField control={invoiceForm.control} name="notes" label="Notas" multiline />

      <SectionTitle>Ítems</SectionTitle>
      {items.map((item, index) => (
        <Card key={`${item.description}-${index}`}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <Pressable onPress={() => removeItem(index)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
          <Text style={styles.itemDetail}>
            {item.quantity} × {formatMoney(item.unit_price)} · IVA {item.iva_porcentaje}%
          </Text>
        </Card>
      ))}

      <Card>
        <FormTextField
          control={itemForm.control}
          name="description"
          label="Descripción"
          placeholder="Consulta médica general"
        />
        <View style={styles.row}>
          <View style={styles.rowField}>
            <FormTextField
              control={itemForm.control}
              name="quantity"
              label="Cantidad"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowField}>
            <FormTextField
              control={itemForm.control}
              name="unit_price"
              label="Precio unit. ($)"
              keyboardType="numeric"
            />
          </View>
        </View>
        <FormSelectField
          control={itemForm.control}
          name="iva_porcentaje"
          label="IVA"
          options={[
            { label: '0% (servicios médicos)', value: '0' },
            { label: '15% (tarifa general)', value: '15' },
          ]}
        />
        <Button title="Agregar ítem" variant="secondary" onPress={addItem} />
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>IVA</Text>
          <Text style={styles.totalValue}>{formatMoney(tax)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatMoney(subtotal + tax)}</Text>
        </View>
      </Card>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Crear factura" onPress={onSubmit} loading={createInvoice.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemDesc: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 },
  itemDetail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  totalLabel: { fontSize: 14, color: colors.textMuted },
  totalValue: { fontSize: 14, color: colors.textBody, fontWeight: '600' },
  grandLabel: { fontSize: 16, color: colors.text, fontWeight: '800' },
  grandValue: { fontSize: 16, color: colors.primaryLight, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginVertical: spacing.sm },
});
