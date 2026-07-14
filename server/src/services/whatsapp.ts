import { config } from '../config.js'
import type { SendResult } from './mailer.js'

/**
 * Adaptador de WhatsApp — preparado pero desactivado.
 *
 * Para activarlo:
 *  1. Consigue un número de WhatsApp Business y plantillas aprobadas por Meta
 *     (los mensajes proactivos fuera de la ventana de 24 h exigen plantilla).
 *  2. Implementa la llamada al proveedor (Twilio o Meta Cloud API) aquí abajo.
 *  3. Pon WHATSAPP_ENABLED=true.
 */
export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<SendResult> {
  if (!config.whatsappEnabled) {
    console.log(`[whatsapp:simulado] → ${to} · ${message.slice(0, 60)}…`)
    return { status: 'simulado' }
  }

  // TODO: llamada real al proveedor cuando haya credenciales y plantillas.
  console.warn('[whatsapp] activado pero sin proveedor implementado')
  return { status: 'error', error: 'Proveedor de WhatsApp no implementado' }
}
