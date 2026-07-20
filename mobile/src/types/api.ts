// Tipos espejo de los schemas Pydantic del backend (backend/app/modules/*).
// No inventar campos: si el backend cambia, actualizar aqui.

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role?: Role | null;
}

// ── Pacientes ─────────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  document_type: string;
  document_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  allergies?: string | null;
}

export interface PatientCreate {
  document_type: string;
  document_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  allergies?: string | null;
  notes?: string | null;
}

export type PatientUpdate = Partial<PatientCreate>;

// ── Citas ─────────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface PatientBasic {
  id: string;
  first_name: string;
  last_name: string;
  document_number: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: string;
  status: AppointmentStatus;
  reason?: string | null;
  patient?: PatientBasic | null;
}

export interface AppointmentCreate {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes?: string;
  reason?: string | null;
  notes?: string | null;
}

export interface AppointmentUpdate {
  scheduled_at?: string;
  status?: AppointmentStatus;
  notes?: string | null;
}

// ── Historia clinica ──────────────────────────────────────────────────────
export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string | null;
  anamnesis?: string | null;
  vital_signs?: Record<string, unknown> | null;
  physical_exam?: string | null;
  diagnosis?: Record<string, unknown>[] | null;
  treatment?: string | null;
  prescriptions?: Record<string, unknown>[] | null;
  notes?: string | null;
  created_at?: string | null;
}

export interface MedicalRecordCreate {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string | null;
  chief_complaint?: string | null;
  anamnesis?: string | null;
  vital_signs?: Record<string, unknown> | null;
  physical_exam?: string | null;
  diagnosis?: Record<string, unknown>[] | null;
  treatment?: string | null;
  prescriptions?: Record<string, unknown>[] | null;
  notes?: string | null;
}

// ── Laboratorio ───────────────────────────────────────────────────────────
export type LabOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: LabOrderStatus;
  tests?: string | null;
  notes?: string | null;
}

export interface LabOrderCreate {
  patient_id: string;
  doctor_id: string;
  record_id?: string | null;
  tests?: string | null;
  notes?: string | null;
}

export interface LabOrderUpdate {
  status?: LabOrderStatus;
  tests?: string | null;
  notes?: string | null;
}

export interface LabResultCreate {
  order_id: string;
  test_name: string;
  value?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  // El backend modela este campo como texto ("si"/"no"), no booleano.
  is_abnormal?: string | null;
}

// ── Inventario ────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  generic_name?: string | null;
  sku?: string | null;
  category?: string | null;
  unit: string;
  min_stock: number;
}

export interface ProductCreate {
  name: string;
  generic_name?: string | null;
  sku?: string | null;
  category?: string | null;
  unit?: string;
  min_stock?: number;
}

export type ProductUpdate = Partial<ProductCreate>;

export interface LotCreate {
  product_id: string;
  lot_number?: string | null;
  quantity: number;
  purchase_price?: number | null;
  sale_price?: number | null;
  expiry_date?: string | null;
}

// ── Facturacion ───────────────────────────────────────────────────────────
export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'insurance';

// Pydantic v2 puede serializar Decimal como string; aceptamos ambos.
export type DecimalLike = number | string;

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: DecimalLike;
  unit_price: DecimalLike;
  iva_porcentaje: DecimalLike;
  total: DecimalLike;
}

export interface Invoice {
  id: string;
  number: string;
  patient_id: string;
  status: InvoiceStatus;
  subtotal: DecimalLike;
  tax: DecimalLike;
  total: DecimalLike;
  notes?: string | null;
  items: InvoiceItem[];
}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;
  unit_price: number;
  // Solo 0 (servicios medicos) o 15 (tarifa general).
  iva_porcentaje: number;
}

export interface InvoiceCreate {
  patient_id: string;
  items: InvoiceItemCreate[];
  notes?: string | null;
}

export interface PaymentCreate {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
}

// ── Reportes ──────────────────────────────────────────────────────────────
export interface DashboardAppointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  reason: string;
  duration_minutes: string;
}

export interface DashboardPatient {
  id: string;
  first_name: string;
  last_name: string;
  document_number: string;
  gender: string;
  created_at: string;
}

export interface DashboardStats {
  citas_hoy: number;
  atendidos_hoy: number;
  ingresos_hoy: number;
  ingresos_mes: number;
  total_pacientes: number;
  nuevos_mes: number;
  facturas_pendientes: number;
  productos_stock_bajo: number;
  citas_hoy_lista: DashboardAppointment[];
  ultimos_pacientes: DashboardPatient[];
}

export interface RevenueReport {
  total_invoiced: number;
  total_collected: number;
  total_pending: number;
  invoice_count: number;
}

export interface PatientStats {
  total_patients: number;
  new_this_month: number;
  active_patients: number;
}

// ── IA ────────────────────────────────────────────────────────────────────
export interface AIResponse {
  response: string;
}
