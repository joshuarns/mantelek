# Despliegue

Arquitectura de producción:

- **Frontend** (React/Vite) → **Vercel** (estático)
- **Backend** (Express) → **Railway** o **Render** (servidor Node + disco persistente)
- **Base de datos** → Postgres gestionado (del mismo proveedor del backend)
- **Archivos subidos** → disco/volumen persistente montado en el backend

> El frontend habla con el backend por HTTP. No comparten servidor: cada uno se
> despliega por separado y se conectan con dos variables (`VITE_API_URL` en el
> frontend y `CLIENT_ORIGIN` en el backend).

---

## Paso 0 — Subir el código a GitHub

Vercel y Railway/Render despliegan desde un repositorio Git. Este proyecto aún no
es un repo:

```bash
git init
git add .
git commit -m "Portal Mantelek: frontend + backend"
git branch -M main
git remote add origin https://github.com/<usuario>/mantelek.git
git push -u origin main
```

`.gitignore` ya excluye `node_modules`, `dist`, `uploads` y los `.env` (los secretos
no se suben).

---

## Paso 1 — Backend + base de datos

### Opción Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. En el servicio, **Settings → Root Directory** = `server`.
3. **New → Database → PostgreSQL**. Railway crea la variable `DATABASE_URL`.
   En el servicio del backend, referénciala (Variables → `DATABASE_URL` =
   `${{Postgres.DATABASE_URL}}`).
4. **Variables** del backend:
   - `DATABASE_SSL` = `false` (conexión interna de Railway)
   - `JWT_SECRET` = *(genera un valor largo aleatorio)*
   - `UPLOAD_DIR` = `/data/uploads`
   - `CLIENT_ORIGIN` = *(la URL de Vercel; se rellena en el Paso 3)*
5. **Volumen persistente** (para que los archivos no se pierdan): el servicio →
   **Volumes** → montar en `/data`.
6. Railway detecta Node, corre `npm run build` y `npm start` automáticamente.

### Opción Render (con blueprint)

1. [render.com](https://render.com) → **New + → Blueprint** → selecciona el repo.
   Render lee [`render.yaml`](render.yaml) y crea el Postgres + el web service + el disco.
2. Cuando pregunte, define `CLIENT_ORIGIN` (Paso 3). `JWT_SECRET` se genera solo.
3. El disco persistente requiere plan **Starter+** (el `render.yaml` ya lo indica).

### Inicializar la base de datos (una sola vez)

Tras el primer despliegue, abre una consola en el servicio (Railway: *Shell* /
Render: *Shell*) dentro de `server/` y ejecuta:

```bash
npm run migrate   # crea las tablas (¡recrea el esquema, borra datos!)
npm run seed      # opcional: datos de demo
```

> **Importante:** `migrate` y `seed` son destructivos (el esquema hace `DROP TABLE`).
> Ejecútalos solo en el setup inicial, nunca en cada deploy. El `startCommand` de
> producción es solo `npm start`, así que no se corren automáticamente.

Anota la URL pública del backend, p. ej. `https://mantelek-api.up.railway.app`.

---

## Paso 2 — Frontend en Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
2. Vercel detecta Vite (ya hay [`vercel.json`](vercel.json) con el rewrite de SPA).
   **Root Directory** = raíz del repo (no `server`).
3. **Environment Variables**:
   - `VITE_API_URL` = `https://<tu-backend>/api`
     (la URL del Paso 1 + `/api`, p. ej. `https://mantelek-api.up.railway.app/api`)
4. **Deploy**. Anota la URL pública, p. ej. `https://mantelek.vercel.app`.

---

## Paso 3 — Conectar ambos (CORS)

En el backend, pon `CLIENT_ORIGIN` = la URL de Vercel del Paso 2
(`https://mantelek.vercel.app`) y redespliega el backend. Puedes listar varias
separadas por coma (p. ej. la de producción y las de preview de Vercel).

Listo: entra a la URL de Vercel e inicia sesión con las credenciales de demo.

---

## Notas y limitaciones

- **Persistencia de archivos**: sin un volumen/disco persistente, los PDFs subidos
  se borran en cada redeploy. En Railway usa un **Volume**; en Render un **Disk**
  (plan de pago). Para escala real conviene mover el storage a S3 / Vercel Blob.
- **Postgres free**: el plan gratuito de Render expira a los 30 días; el de Railway
  tiene límite de uso. Para algo estable, usa un plan de pago o Neon/Supabase.
- **Cold starts**: en planes free el backend puede "dormirse"; la primera petición
  tras inactividad tarda unos segundos.
- **Secretos**: nunca subas `.env`. Configura las variables en el panel de cada
  proveedor. Usa un `JWT_SECRET` largo y aleatorio en producción.
