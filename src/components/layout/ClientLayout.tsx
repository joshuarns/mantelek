import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  User,
  FileText,
  History,
  Bell,
  LifeBuoy,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/informacion', label: 'Información General', icon: User },
  { to: '/documentos', label: 'Documentos del Mes', icon: FileText },
  { to: '/historial', label: 'Historial de Cumplimiento', icon: History },
  { to: '/notificaciones', label: 'Notificaciones', icon: Bell },
  { to: '/soporte', label: 'Soporte', icon: LifeBuoy },
]

export function ClientLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Cierra el menú al cambiar de ruta.
  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Backdrop móvil */}
      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar (drawer en móvil, fijo en desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-brand-950 p-4 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <Logo />
          <button
            onClick={() => setMenuOpen(false)}
            className="text-slate-400 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
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

        <div className="mt-auto rounded-xl bg-white/5 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">¿Necesitas ayuda?</p>
          <p className="mt-1 text-slate-400">Contáctanos</p>
          <p className="mt-2">55 1234 5678</p>
          <p className="text-brand-500">soporte@mantelek.com</p>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="ml-auto text-right leading-tight">
            <p className="text-sm font-semibold text-slate-800">Hola, {user?.fullName}</p>
            <p className="text-xs text-slate-500">Proveedor</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500">
            <User size={18} />
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
