import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ClientLayout } from './components/layout/ClientLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/client/Dashboard'
import { InformacionGeneral } from './pages/client/InformacionGeneral'
import { DocumentosDelMes } from './pages/client/DocumentosDelMes'
import { VistaDocumento } from './pages/client/VistaDocumento'
import { HistorialCumplimiento } from './pages/client/HistorialCumplimiento'
import { Notificaciones } from './pages/client/Notificaciones'
import { Soporte } from './pages/client/Soporte'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { Clientes } from './pages/admin/Clientes'
import { Descargas } from './pages/admin/Descargas'
import { Placeholder } from './pages/admin/Placeholder'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Portal del cliente / proveedor */}
        <Route element={<ProtectedRoute role="client" />}>
          <Route element={<ClientLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="informacion" element={<InformacionGeneral />} />
            <Route path="documentos" element={<DocumentosDelMes />} />
            <Route path="documentos/:type" element={<VistaDocumento />} />
            <Route path="historial" element={<HistorialCumplimiento />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="soporte" element={<Soporte />} />
          </Route>
        </Route>

        {/* Panel administrativo Mantelek */}
        <Route path="admin" element={<ProtectedRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route
              path="cumplimiento"
              element={
                <Placeholder
                  title="Cumplimiento"
                  description="Vista consolidada del cumplimiento mensual de toda la cartera, con filtros por periodo, tipo de persona y documento pendiente."
                />
              }
            />
            <Route
              path="documentos"
              element={
                <Placeholder
                  title="Documentos"
                  description="Explorador de todos los expedientes documentales por cliente, mes y tipo de documento."
                />
              }
            />
            <Route path="descargas" element={<Descargas />} />
            <Route
              path="reportes"
              element={
                <Placeholder
                  title="Reportes"
                  description="Reportes de cumplimiento, indicadores por periodo y exportación de métricas de la cartera."
                />
              }
            />
            <Route
              path="configuracion"
              element={
                <Placeholder
                  title="Configuración"
                  description="Catálogo de documentos requeridos, fechas límite, canales de notificación (correo/WhatsApp) y usuarios administradores."
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
