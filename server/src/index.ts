import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import multer from 'multer'
import { config } from './config.js'
import { pool } from './db/pool.js'
import { authRouter } from './routes/auth.js'
import { meRouter } from './routes/me.js'
import { documentsRouter } from './routes/documents.js'
import { adminRouter } from './routes/admin.js'

const app = express()

app.use(cors({ origin: config.clientOrigin }))
app.use(express.json())

// Healthcheck. Se responde también en "/" porque algunos proveedores
// (Railway, Render) sondean la raíz por defecto.
const health = (_req: Request, res: Response) =>
  res.json({ ok: true, service: 'mantelek-api' })
app.get('/', health)
app.get('/api/health', health)

app.use('/api/auth', authRouter)
app.use('/api/me', meRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/admin', adminRouter)

// 404 para rutas de API desconocidas
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

// Manejo central de errores
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? `El archivo supera el límite de ${config.maxUploadBytes / 1_048_576} MB`
        : err.message
    return res.status(400).json({ error: msg })
  }
  console.error('[error]', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const server = app.listen(config.port, () => {
  console.log(`Mantelek API escuchando en http://localhost:${config.port}`)
})

// Apagado ordenado: cierra el servidor y el pool para que el reinicio
// (tsx watch / redeploy) sea limpio y no quede el puerto ocupado.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      pool.end().finally(() => process.exit(0))
    })
    // Salida forzada si algo no cierra en 3s.
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
