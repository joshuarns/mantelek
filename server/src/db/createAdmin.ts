import { pool } from './pool.js'
import { hashPassword } from '../lib/auth.js'

/**
 * Crea (o actualiza la contraseña de) un usuario administrador de Mantelek.
 *
 *   npm run create-admin -- correo@mantelek.com "MiClaveSegura" "Nombre Apellido"
 */
async function main() {
  const [email, password, ...nameParts] = process.argv.slice(2)
  const fullName = nameParts.join(' ').trim() || 'Administrador'

  if (!email || !password) {
    console.error(
      'Uso: npm run create-admin -- <correo> <contraseña> [nombre completo]',
    )
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  const hash = await hashPassword(password)
  const { rows } = await pool.query<{ id: string; email: string }>(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES (lower($1), $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           full_name     = EXCLUDED.full_name,
           role          = 'admin'
     RETURNING id, email`,
    [email, hash, fullName],
  )

  console.log(`✔ Administrador listo: ${rows[0].email}`)
  await pool.end()
}

main().catch((err) => {
  console.error('Error creando el administrador:', err)
  process.exit(1)
})
