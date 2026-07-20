import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { getErrorMessage } from '@/api/errors';
import { FormTextField } from '@/components/fields';
import { Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'signedIn') return <Redirect href="/(app)/(tabs)" />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await login(values.email.trim(), values.password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoCircle}>
          <Ionicons name="medkit" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>MediCore</Text>
        <Text style={styles.subtitle}>Gestión clínica para tu consultorio</Text>

        <View style={styles.card}>
          <FormTextField
            control={control}
            name="email"
            label="Email"
            placeholder="doctor@clinica.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormTextField
            control={control}
            name="password"
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <Button title="Iniciar sesión" onPress={onSubmit} loading={submitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoCircle: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#cfe3f5',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
