import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { DEFAULT_API_URL, getBaseUrl, setBaseUrl } from '@/api/client';
import { saveServerUrl } from '@/api/tokens';
import { Button, Card, InfoRow, SectionTitle } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [serverUrl, setServerUrl] = useState(getBaseUrl());
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const saveUrl = async () => {
    const trimmed = serverUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/.test(trimmed)) {
      Alert.alert('URL inválida', 'Debe empezar con http:// o https://');
      return;
    }
    setSaving(true);
    try {
      setBaseUrl(trimmed);
      await saveServerUrl(trimmed);
      setServerUrl(trimmed);
      queryClient.clear();
      Alert.alert('Servidor actualizado', 'La app ahora apunta a:\n' + trimmed);
    } finally {
      setSaving(false);
    }
  };

  const resetUrl = async () => {
    setBaseUrl(DEFAULT_API_URL);
    await saveServerUrl('');
    setServerUrl(DEFAULT_API_URL);
    queryClient.clear();
  };

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar tu sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          queryClient.clear();
          setLoggingOut(false);
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <SectionTitle>Cuenta</SectionTitle>
      <Card>
        <InfoRow label="Rol" value={user?.role?.name ?? 'Sin rol'} />
        <InfoRow label="Estado" value={user?.is_active ? 'Activa' : 'Inactiva'} />
      </Card>

      <SectionTitle>Servidor</SectionTitle>
      <Card>
        <Text style={styles.label}>URL del servidor (API)</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder={DEFAULT_API_URL}
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.hint}>
          En un dispositivo físico usa la IP LAN de tu PC, p.ej. http://192.168.1.10:8000/api/v1
        </Text>
        <View style={styles.row}>
          <Button title="Guardar" onPress={saveUrl} loading={saving} style={styles.rowButton} />
          <Button
            title="Restablecer"
            variant="secondary"
            onPress={resetUrl}
            style={styles.rowButton}
          />
        </View>
      </Card>

      <Button
        title="Cerrar sesión"
        variant="danger"
        onPress={confirmLogout}
        loading={loggingOut}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textBody,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowButton: { flex: 1 },
});
