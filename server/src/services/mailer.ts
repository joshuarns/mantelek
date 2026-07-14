import { config } from '../config.js'

export interface SendResult {
  status: 'enviado' | 'error' | 'simulado'
  error?: string
}

/**
 * Envía un correo con Resend.
 * Sin RESEND_API_KEY no falla: devuelve "simulado" y lo registra en consola,
 * de modo que el sistema es usable antes de configurar el proveedor.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!config.resendApiKey) {
    console.log(`[mail:simulado] → ${to} · ${subject}`)
    return { status: 'simulado' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.mailFrom,
        to: [to],
        ...(config.mailBcc ? { bcc: [config.mailBcc] } : {}),
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[mail:error] ${to} · ${res.status} ${body}`)
      return { status: 'error', error: `${res.status} ${body}`.slice(0, 500) }
    }

    console.log(`[mail:enviado] → ${to} · ${subject}`)
    return { status: 'enviado' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[mail:error] ${to} · ${msg}`)
    return { status: 'error', error: msg.slice(0, 500) }
  }
}
