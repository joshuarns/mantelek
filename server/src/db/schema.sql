-- Esquema del portal de cumplimiento documental Mantelek.
--
-- Este script es ADITIVO E IDEMPOTENTE: se puede correr las veces que haga
-- falta (incluso en producción) sin borrar datos. Para vaciar todo y empezar
-- de cero en desarrollo, usa `npm run db:reset`.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clientes / proveedores
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  person_type         TEXT NOT NULL CHECK (person_type IN ('fisica', 'moral')),
  rfc                 TEXT NOT NULL,
  tax_regime          TEXT,
  tax_address         TEXT,
  phone               TEXT,
  email               TEXT,
  admin_contact       TEXT,
  bank_name           TEXT,
  bank_account        TEXT,
  bank_clabe          TEXT,
  constancia_updated_at TIMESTAMPTZ,
  last_access_at      TIMESTAMPTZ,
  last_upload_at      TIMESTAMPTZ,
  active              BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuarios de acceso al portal (cliente o administrador Mantelek)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un registro de cumplimiento por cliente y periodo (YYYY-MM)
CREATE TABLE IF NOT EXISTS monthly_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'en_proceso'
                 CHECK (status IN ('cumplido', 'en_proceso', 'vencido', 'sin_actividad')),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, period)
);

-- Documentos requeridos dentro de cada registro mensual
CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id    UUID NOT NULL REFERENCES monthly_records(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  label        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('cargado', 'pendiente')),
  file_name    TEXT,
  file_path    TEXT,
  file_size    BIGINT,
  mime_type    TEXT,
  uploaded_at  TIMESTAMPTZ,
  uploaded_by  TEXT,
  UNIQUE (record_id, type)
);

-- Bitácora de recordatorios enviados (Módulo 5).
-- La restricción UNIQUE garantiza que un mismo aviso no se envíe dos veces.
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('dia_10', 'dia_15', 'dia_20', 'completado')),
  channel    TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient  TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'enviado'
               CHECK (status IN ('enviado', 'error', 'simulado')),
  error      TEXT,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, period, kind, channel)
);

CREATE INDEX IF NOT EXISTS idx_records_client ON monthly_records (client_id);
CREATE INDEX IF NOT EXISTS idx_documents_record ON documents (record_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications (client_id, period);

-- Migraciones aditivas para bases creadas con versiones anteriores.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
-- Observaciones internas de Mantelek sobre el cliente (Módulo 7).
-- Solo las ve el personal administrativo, nunca el cliente.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
