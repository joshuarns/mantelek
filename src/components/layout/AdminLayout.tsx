import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Download,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/cumplimiento', label: 'Cumplimiento', icon: ClipboardCheck },
  { to: '/admin/documentos', label: 'Documentos', icon: FileText },
  { to: '/admin/descargas', label: 'Descargas', icon: Download },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-brand-950 p-4 md:flex">
        <div className="px-2 py-3">
          <Logo subtitle="Admin" />
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName ?? 'Mantelek'}</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
            <Users size={18} />
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
