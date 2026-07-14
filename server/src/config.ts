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
  // Se normaliza quitando espacios y la barra final: el header `Origin` del
  // navegador nunca la lleva, así que "https://app.com/" nunca casaría.
  clientOrigin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
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

  // --- Notificaciones (Módulo 5) ---
  // Si no hay API key, los recordatorios se registran como "simulado" en la
  // bitácora en vez de enviarse. Así el sistema funciona sin credenciales.
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'Mantelek <onboarding@resend.dev>',
  // Copia oculta a Mantelek de cada recordatorio (opcional).
  mailBcc: process.env.MAIL_BCC ?? '',
  // Pon "false" para desactivar el envío automático programado.
  remindersEnabled: process.env.REMINDERS_ENABLED !== 'false',
  // Zona horaria para el cron de recordatorios.
  timezone: process.env.TZ_CRON ?? 'America/Mexico_City',
  // URL del portal, para incluirla en los correos.
  portalUrl: process.env.PORTAL_URL ?? 'https://mantelek.vercel.app',

  // WhatsApp: preparado pero apagado hasta tener credenciales.
  whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
}
