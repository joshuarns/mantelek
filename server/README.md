# Mantelek API

Backend del portal de cumplimiento documental. **Node + Express + PostgreSQL** (TypeScript).

## Requisitos

- Node 18+
- PostgreSQL 16 corriendo en local

Postgres ya quedó instalado vía Homebrew. Para arrancar el servicio:

```bash
brew services start postgresql@16
```

La base `mantelek` (usuario/clave `mantelek`) ya está creada. Para recrearla desde cero:

```bash
export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
psql -d postgres -c "CREATE ROLE mantelek LOGIN PASSWORD 'mantelek';"
psql -d postgres -c "CREATE DATABASE mantelek OWNER mantelek;"
```

## Puesta en marcha

```bash
cd server
cp .env.example .env      # ya existe uno con valores de desarrollo
npm install
npm run reset             # aplica el esquema + siembra datos de demo
npm run dev               # API en http://localhost:4000
```

Scripts:

| Script            | Acción                                   |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Servidor con recarga (tsx watch)         |
| `npm run migrate` | Aplica `src/db/schema.sql`               |
| `npm run seed`    | Siembra clientes/usuarios de demo        |
| `npm run reset`   | migrate + seed                           |
| `npm run build`   | Compila a `dist/`                        |
| `npm start`       | Ejecuta la build de producción           |

## Credenciales de demo

| Rol     | Correo                  | Contraseña  |
| ------- | ----------------------- | ----------- |
| Cliente | `juan@soluciones.com`   | `demo1234`  |
| Cliente | `maria@correo.com`      | `demo1234`  |
| Admin   | `admin@mantelek.com`    | `admin1234` |

## Endpoints

Autenticación con `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`

### Cliente (`/api/me`)
- `GET /api/me` — información general + expediente del periodo actual
- `PUT /api/me` — actualiza información editable (Módulo 1)
- `GET /api/me/records` — historial de cumplimiento (Módulo 6)
- `GET /api/me/records/:period` — expediente de un periodo (`YYYY-MM`)

### Documentos (`/api/documents`)
- `POST /api/documents/:period/:type` — carga un archivo (multipart, campo `file`)
- `DELETE /api/documents/:period/:type` — elimina un documento cargado
- `GET /api/documents/:id/download` — descarga/visualiza (dueño o admin)

### Administración (`/api/admin`, solo rol admin)
- `GET /api/admin/stats` — KPIs del semáforo (Módulos 7 y 8)
- `GET /api/admin/clients?period=YYYY-MM` — cartera con estatus y avance
- `GET /api/admin/download?clientId=&period=` — ZIP para auditorías/SAT (Módulo 10)

## Notas de arquitectura

- **Módulo 2**: `src/lib/documents.ts` define qué documentos aplican a Persona Física vs
  Moral. El expediente mensual se genera automáticamente al consultarlo (`ensureRecord`).
- **Avance (Módulo 4)**: `computeProgress` es la única fuente de verdad; "Otros Documentos"
  es opcional y no cuenta para el porcentaje. Al llegar a 100% el estatus pasa a `cumplido`.
- **Almacenamiento**: los archivos se guardan en `server/uploads/<clientId>/<periodo>/`.
  Para producción conviene mover a S3 u otro object storage.
- **Migrar a otro Postgres**: solo cambia `DATABASE_URL` en `.env`.

## Pendiente (siguientes pasos)

- Conectar el frontend (React) a esta API en lugar de `src/lib/mockData.ts`.
- Notificaciones automáticas por correo/WhatsApp los días 10/15/20 (Módulo 5) vía cron.
- Job de vencimiento: marcar `vencido` los expedientes incompletos tras el día 20.
