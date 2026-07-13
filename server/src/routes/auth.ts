import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db/pool.js'
import { signToken, verifyPassword } from '../lib/auth.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

interface UserRow {
  id: string
  client_id: string | null
  email: string
  password_hash: string
  full_name: string
  role: 'client' | 'admin'
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Correo o contraseña inválidos' })
    }
    const { email, password } = parsed.data

    const { rows } = await query<UserRow>(
      'SELECT id, client_id, email, password_hash, full_name, role FROM users WHERE lower(email) = lower($1)',
      [email],
    )
    const user = rows[0]
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Registrar último acceso del cliente.
    if (user.client_id) {
      await query('UPDATE clients SET last_access_at = now() WHERE id = $1', [
        user.client_id,
      ])
    }

    const token = signToken({
      userId: user.id,
      clientId: user.client_id,
      role: user.role,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        clientId: user.client_id,
      },
    })
  }),
)
