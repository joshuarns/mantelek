# Mantelek — Portal de Cumplimiento Documental

Portal web donde clientes/proveedores mantienen su información fiscal y cargan la
documentación obligatoria de cada mes antes del día 20, con seguimiento automático,
semáforo de cumplimiento y descarga en .zip para auditorías/SAT.

- **Frontend** — React + Vite + TypeScript + Tailwind v4 + React Router (raíz del repo)
- **Backend** — Node + Express + PostgreSQL (`server/`)

## Puesta en marcha (dos terminales)

**1. Base de datos + API**

```bash
brew services start postgresql@16   # si no está corriendo
cd server
npm install
npm run reset                        # esquema + datos de demo (solo la primera vez)
npm run dev                          # API en http://localhost:4000
```

**2. Frontend**

```bash
npm install
npm run dev                          # app en http://localhost:5173
```

El frontend redirige `/api/*` al backend (proxy de Vite), así que no hay que configurar CORS en dev.

## Credenciales de demo

| Rol     | Correo                | Contraseña  |
| ------- | --------------------- | ----------- |
| Cliente | `juan@soluciones.com` | `demo1234`  |
| Cliente | `maria@correo.com`    | `demo1234`  |
| Admin   | `admin@mantelek.com`  | `admin1234` |

## Estructura

```
src/                     Frontend
  lib/        api, auth (contexto), apiTypes, format, documents
  hooks/      useFetch
  components/ layout (Client/Admin), ui (StatusBadge, Progress, StatCard, States), ProtectedRoute
  pages/      Login, client/ (7 vistas), admin/ (Dashboard, Clientes, Descargas, placeholders)
server/                  Backend (ver server/README.md)
  src/routes/  auth, me, documents, admin
  src/services/ clients, records
  src/db/      schema.sql, migrate, seed
```

## Estado

- ✅ Frontend conectado a la API real (sin datos mock). Login con sesión, rutas protegidas por rol,
  carga/descarga de archivos, edición de información, panel admin y descarga ZIP.
- ⏳ Pendiente: notificaciones automáticas correo/WhatsApp los días 10/15/20 (Módulo 5);
  job que marca `vencido` los expedientes incompletos tras el día 20.

Detalle del backend y endpoints en [server/README.md](server/README.md).
