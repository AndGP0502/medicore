import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

const MODULES: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
}[] = [
  {
    title: 'Laboratorio',
    subtitle: 'Órdenes y resultados',
    icon: 'flask',
    href: '/(app)/lab',
  },
  {
    title: 'Inventario',
    subtitle: 'Productos, lotes y stock',
    icon: 'cube',
    href: '/(app)/inventory',
  },
  {
    title: 'Facturación',
    subtitle: 'Facturas y pagos',
    icon: 'receipt',
    href: '/(app)/billing',
  },
  {
    title: 'Reportes',
    subtitle: 'Ingresos y pacientes',
    icon: 'bar-chart',
    href: '/(app)/reports',
  },
  {
    title: 'Asistente IA',
    subtitle: 'Consultas de apoyo clínico',
    icon: 'sparkles',
    href: '/(app)/ai',
  },
  {
    title: 'Perfil',
    subtitle: 'Cuenta, servidor y sesión',
    icon: 'person-circle',
    href: '/(app)/profile',
  },
];

export default function MoreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {MODULES.map((module) => (
        <Pressable
          key={module.title}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
          onPress={() => router.push(module.href)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={module.icon} size={22} color={colors.primaryLight} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{module.title}</Text>
            <Text style={styles.subtitle}>{module.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${colors.primaryLight}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
