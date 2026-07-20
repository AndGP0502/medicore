// Paleta tomada del frontend web existente de MediCore para mantener
// una identidad visual consistente entre plataformas.
export const colors = {
  primary: '#0a3d6b',
  primaryLight: '#0d5fa3',
  accent: '#1a7fc4',
  background: '#f0f4f8',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0a3d6b',
  textBody: '#374151',
  textMuted: '#6b7c93',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#059669',
  info: '#2563eb',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const statusColors: Record<string, string> = {
  // Citas
  scheduled: colors.info,
  confirmed: colors.accent,
  in_progress: colors.warning,
  completed: colors.success,
  cancelled: colors.danger,
  no_show: colors.textMuted,
  // Laboratorio
  pending: colors.warning,
  processing: colors.info,
  // Facturacion
  paid: colors.success,
  partial: colors.warning,
};

export const statusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
  pending: 'Pendiente',
  processing: 'Procesando',
  paid: 'Pagada',
  partial: 'Pago parcial',
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  insurance: 'Seguro',
};
