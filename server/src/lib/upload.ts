import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { config } from '../config.js'

// Los archivos se guardan en memoria y se escriben a disco tras validar
// que el documento pertenece al cliente (en el handler de la ruta).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    cb(null, allowed.includes(file.mimetype))
  },
})

/** Escribe el buffer a uploads/<clientId>/<period>/<name> y devuelve la ruta absoluta. */
export function saveFile(
  clientId: string,
  period: string,
  fileName: string,
  buffer: Buffer,
): string {
  const dir = path.join(config.uploadDir, clientId, period)
  fs.mkdirSync(dir, { recursive: true })
  const fullPath = path.join(dir, fileName)
  fs.writeFileSync(fullPath, buffer)
  return fullPath
}

export function removeFile(filePath: string | null): void {
  if (filePath && fs.existsSync(filePath)) fs.rmSync(filePath)
}
