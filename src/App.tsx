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
import { ExpedienteMes } from './pages/client/ExpedienteMes'
import { Notificaciones } from './pages/client/Notificaciones'
import { Soporte } from './pages/client/Soporte'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { Clientes } from './pages/admin/Clientes'
import { Cumplimiento } from './pages/admin/Cumplimiento'
import { Documentos } from './pages/admin/Documentos'
import { Descargas } from './pages/admin/Descargas'
import { Reportes } from './pages/admin/Reportes'
import { Configuracion } from './pages/admin/Configuracion'

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
            <Route path="historial/:period" element={<ExpedienteMes />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="soporte" element={<Soporte />} />
          </Route>
        </Route>

        {/* Panel administrativo Mantelek */}
        <Route path="admin" element={<ProtectedRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="cumplimiento" element={<Cumplimiento />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="descargas" element={<Descargas />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
