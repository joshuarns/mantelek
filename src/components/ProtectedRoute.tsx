import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

/** Exige sesión activa; opcionalmente un rol específico. */
export function ProtectedRoute({ role }: { role?: 'client' | 'admin' }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    // Un usuario autenticado con rol distinto va a su inicio correspondiente.
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  }
  return <Outlet />
}
