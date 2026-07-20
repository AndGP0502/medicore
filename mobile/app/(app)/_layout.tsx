import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/theme';

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);
  if (status !== 'signedIn') return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="patients/new" options={{ title: 'Nuevo paciente' }} />
      <Stack.Screen name="patients/[id]/index" options={{ title: 'Paciente' }} />
      <Stack.Screen name="patients/[id]/edit" options={{ title: 'Editar paciente' }} />
      <Stack.Screen name="patients/[id]/records" options={{ title: 'Historia clínica' }} />
      <Stack.Screen name="patients/[id]/new-record" options={{ title: 'Nueva consulta' }} />
      <Stack.Screen name="records/[recordId]" options={{ title: 'Consulta' }} />
      <Stack.Screen name="appointments/new" options={{ title: 'Nueva cita' }} />
      <Stack.Screen name="lab/index" options={{ title: 'Laboratorio' }} />
      <Stack.Screen name="lab/new" options={{ title: 'Nueva orden' }} />
      <Stack.Screen name="lab/[id]" options={{ title: 'Orden de laboratorio' }} />
      <Stack.Screen name="inventory/index" options={{ title: 'Inventario' }} />
      <Stack.Screen name="inventory/new" options={{ title: 'Nuevo producto' }} />
      <Stack.Screen name="inventory/[id]" options={{ title: 'Producto' }} />
      <Stack.Screen name="billing/index" options={{ title: 'Facturación' }} />
      <Stack.Screen name="billing/new" options={{ title: 'Nueva factura' }} />
      <Stack.Screen name="billing/[id]" options={{ title: 'Factura' }} />
      <Stack.Screen name="reports" options={{ title: 'Reportes' }} />
      <Stack.Screen name="ai" options={{ title: 'Asistente IA' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
    </Stack>
  );
}
