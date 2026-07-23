// Genera una contraseña aleatoria segura (sin caracteres ambiguos como l/1/O/0).
const CHARS = {
  upper: 'ABCDEFGHJKMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnpqrstuvwxyz',
  digits: '23456789',
  symbols: '!@#$%&*?',
}

/** Entero aleatorio en [0, max) con crypto. */
function randInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function pick(set: string): string {
  return set[randInt(set.length)]
}

export function generatePassword(length = 12): string {
  const all = CHARS.upper + CHARS.lower + CHARS.digits + CHARS.symbols
  // Garantiza al menos uno de cada tipo.
  const out = [
    pick(CHARS.upper),
    pick(CHARS.lower),
    pick(CHARS.digits),
    pick(CHARS.symbols),
  ]
  while (out.length < length) out.push(pick(all))
  // Fisher-Yates para que los tipos garantizados no queden siempre al inicio.
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.join('')
}
