import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize = 'sentences',
}: TextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              error && styles.inputError,
            ]}
            value={value == null ? '' : String(value)}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            autoCapitalize={autoCapitalize}
          />
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Seleccionar…',
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selected = options.find((o) => o.value === value);
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
              style={[styles.input, styles.selectInput, error && styles.inputError]}
              onPress={() => setOpen(true)}
            >
              <Text style={selected ? styles.selectValue : styles.selectPlaceholder}>
                {selected ? selected.label : placeholder}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            <Modal visible={open} transparent animationType="fade">
              <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <ScrollView>
                    {options.map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.optionRow}
                        onPress={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            option.value === value && styles.optionSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.value === value ? (
                          <Ionicons name="checkmark" size={18} color={colors.primaryLight} />
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textBody,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.textBody,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontSize: 15, color: colors.textBody },
  selectPlaceholder: { fontSize: 15, color: colors.textMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,61,107,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 15, color: colors.textBody },
  optionSelected: { color: colors.primaryLight, fontWeight: '700' },
});
