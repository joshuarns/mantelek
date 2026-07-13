import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  // Muchos Postgres gestionados (Render, Neon, etc.) exigen SSL.
  databaseSsl: process.env.DATABASE_SSL === 'true',
  port: Number(process.env.PORT ?? 4000),
  // Uno o varios orígenes permitidos por CORS, separados por coma.
  clientOrigin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Ruta absoluta al directorio de subidas (server/uploads por defecto).
  uploadDir: path.resolve(
    __dirname,
    '..',
    process.env.UPLOAD_DIR ?? 'uploads',
  ),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 15) * 1024 * 1024,
}
