import { pool } from './pool.js'

/**
 * ⚠️ DESTRUCTIVO: borra todas las tablas y sus datos.
 * Solo para desarrollo. En producción usa `npm run migrate` (aditivo).
 *
 *   npm run db:reset -- --si-estoy-seguro
 */
async function reset() {
  if (!process.argv.includes('--si-estoy-seguro')) {
    console.error(
      'Esto BORRA todos los datos. Si es lo que quieres:\n' +
        '  npm run db:reset -- --si-estoy-seguro',
    )
    process.exit(1)
  }

  await pool.query(`
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS monthly_records CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
  `)
  console.log('✔ Tablas eliminadas. Corre `npm run migrate` para recrearlas.')
  await pool.end()
}

reset().catch((err) => {
  console.error('Error en reset:', err)
  process.exit(1)
})
