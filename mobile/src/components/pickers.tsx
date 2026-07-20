import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { usePatients } from '@/api/patients';
import { useDoctors } from '@/api/auth';
import { fullName } from '@/utils/format';
import { colors, radius, spacing } from '@/theme';
import { EmptyState } from './ui';

interface PickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

/** Selector de paciente con búsqueda en vivo contra GET /patients. */
export function PatientPickerField<T extends FieldValues>({
  control,
  name,
  label,
}: PickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const { items, isLoading, fetchNextPage, hasNextPage } = usePatients(search);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <Pressable
            style={[styles.input, error && styles.inputError]}
            onPress={() => setOpen(true)}
          >
            <Text style={value ? styles.value : styles.placeholder}>
              {value && selectedLabel ? selectedLabel : value ? 'Paciente seleccionado' : 'Buscar paciente…'}
            </Text>
            <Ionicons name="search" size={18} color={colors.textMuted} />
          </Pressable>
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.modalTitle}>{label}</Text>
                <View style={{ width: 24 }} />
              </View>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Nombre o cédula…"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              {isLoading ? (
                <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primaryLight} />
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(p) => p.id}
                  onEndReached={() => hasNextPage && fetchNextPage()}
                  ListEmptyComponent={<EmptyState message="Sin resultados" />}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.resultRow}
                      onPress={() => {
                        onChange(item.id);
                        setSelectedLabel(fullName(item));
                        setOpen(false);
                      }}
                    >
                      <Text style={styles.resultName}>{fullName(item)}</Text>
                      <Text style={styles.resultDoc}>{item.document_number}</Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          </Modal>
        </View>
      )}
    />
  );
}

/** Selector de doctor desde GET /users/doctors. */
export function DoctorPickerField<T extends FieldValues>({
  control,
  name,
  label,
}: PickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const { data: doctors, isLoading } = useDoctors();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selected = doctors?.find((d) => d.id === value);
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
              style={[styles.input, error && styles.inputError]}
              onPress={() => setOpen(true)}
            >
              <Text style={selected ? styles.value : styles.placeholder}>
                {selected ? selected.full_name : 'Seleccionar doctor…'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            <Modal visible={open} transparent animationType="fade">
              <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                <View style={styles.sheet}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  {isLoading ? (
                    <ActivityIndicator color={colors.primaryLight} />
                  ) : doctors && doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <Pressable
                        key={doctor.id}
                        style={styles.resultRow}
                        onPress={() => {
                          onChange(doctor.id);
                          setOpen(false);
                        }}
                      >
                        <Text style={styles.resultName}>{doctor.full_name}</Text>
                        {doctor.id === value ? (
                          <Ionicons name="checkmark" size={18} color={colors.primaryLight} />
                        ) : null}
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.placeholder}>
                      No hay usuarios con rol doctor registrados.
                    </Text>
                  )}
                </View>
              </Pressable>
            </Modal>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  value: { fontSize: 15, color: colors.textBody, flexShrink: 1 },
  placeholder: { fontSize: 15, color: colors.textMuted },
  modalContainer: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textBody,
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultName: { fontSize: 15, color: colors.textBody, fontWeight: '600' },
  resultDoc: { fontSize: 13, color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,61,107,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
});
