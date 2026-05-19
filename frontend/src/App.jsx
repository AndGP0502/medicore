import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './components/ui/DashboardLayout'
import PatientsPage from './pages/patients/PatientsPage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import MedicalRecordsPage from './pages/medical_records/MedicalRecordsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import LaboratoryPage from './pages/laboratory/LaboratoryPage'
import ReportsPage from './pages/reports/ReportsPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/patients" replace />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="laboratory" element={<LaboratoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
