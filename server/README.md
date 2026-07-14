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
npm run migrate           # aplica el esquema (¡recrea las tablas!)
npm run create-admin -- tu@correo.com "TuContraseña" "Tu Nombre"
npm run dev               # API en http://localhost:4000
```

Scripts:

| Script                 | Acción                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Servidor con recarga (tsx watch)                              |
| `npm run migrate`      | Aplica el esquema. **Aditivo y seguro**: no borra datos        |
| `npm run create-admin` | Crea/actualiza un usuario administrador                       |
| `npm run db:reset`     | ⚠️ **Destructivo**: borra todas las tablas (solo desarrollo)   |
| `npm run build`        | Compila a `dist/`                                             |
| `npm start`            | Ejecuta la build de producción                                |

## Notificaciones (Módulo 5)

Un cron dentro del servidor envía recordatorios por correo los **días 10, 15 y 20
a las 09:00**, solo a los clientes con documentos obligatorios pendientes. Al llegar
al 100% se envía el aviso de "expediente completado" y **dejan de enviarse recordatorios**.
El día siguiente a la fecha límite, los expedientes incompletos pasan a `vencido`.

Los envíos quedan en la tabla `notifications`, con `UNIQUE(cliente, periodo, tipo, canal)`:
un mismo aviso **nunca se manda dos veces**.

> Sin `RESEND_API_KEY` el sistema funciona igual, pero los recordatorios se registran
> como `simulado` en vez de enviarse. Configura la key para que salgan de verdad.

## Primer acceso

No hay datos de demo. Crea el administrador con `create-admin` y desde el panel
(**Clientes → Nuevo cliente**) das de alta cada cliente junto con su usuario de acceso.

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
- `GET /api/admin/clients?period=YYYY-MM&inactivos=1` — cartera con estatus y avance
- `POST /api/admin/clients` — alta de cliente + su usuario de acceso
- `PUT /api/admin/clients/:id` — editar datos del cliente
- `PATCH /api/admin/clients/:id/active` — activar / desactivar (bloquea su acceso)
- `PATCH /api/admin/clients/:id/password` — cambiar la contraseña del cliente
- `DELETE /api/admin/clients/:id` — eliminar cliente, expediente y archivos
- `GET /api/admin/download?clientId=&period=` — ZIP para auditorías/SAT (Módulo 10)
- `GET /api/admin/notifications` — bitácora de recordatorios enviados
- `POST /api/admin/notifications/run` — `{ day: 10|15|20 }` dispara los recordatorios a mano
- `POST /api/admin/notifications/overdue` — marca como `vencido` los expedientes incompletos

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
