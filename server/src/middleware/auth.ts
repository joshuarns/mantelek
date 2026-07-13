import type { NextFunction, Request, Response } from 'express'
import { verifyToken, type TokenPayload } from '../lib/auth.js'

// Extiende Request con la identidad autenticada.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  try {
    req.auth = verifyToken(header.slice(7))
    next()
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' })
  }
  next()
}
