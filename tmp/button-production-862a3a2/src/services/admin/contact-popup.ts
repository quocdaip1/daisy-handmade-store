import { apiUrl } from '../../config/api'
import { mapContactPopup } from '../contact-popup'
import type { ContactPopupSettings } from '../../types/contact-popup'

interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AdminContactPopupRequestError extends Error {
  readonly errors: Record<string, string[]>

  constructor(response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.errors = response.errors ?? {}
  }
}

function payload(settings: ContactPopupSettings) {
  return {
    facebook: {
      display_name: settings.facebook.displayName.trim(),
      link: settings.facebook.link.trim(),
      enabled: settings.facebook.enabled,
    },
    zalo: {
      display_name: settings.zalo.displayName.trim(),
      phone: settings.zalo.phone.trim(),
      link: settings.zalo.link.trim(),
      enabled: settings.zalo.enabled,
    },
  }
}

async function request(token: string, options?: RequestInit): Promise<{ settings: ContactPopupSettings; message?: string }> {
  const response = await fetch(apiUrl('/admin/settings/contact-popup'), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json() as { data?: Parameters<typeof mapContactPopup>[0]; message?: string } & ErrorResponse
    : {} as { data?: Parameters<typeof mapContactPopup>[0]; message?: string } & ErrorResponse
  if (!response.ok || !result.data) throw new AdminContactPopupRequestError(result, 'Không thể lưu thông tin liên hệ.')
  return { settings: mapContactPopup(result.data), message: result.message }
}

export async function fetchAdminContactPopup(token: string) {
  return (await request(token)).settings
}

export function updateAdminContactPopup(token: string, settings: ContactPopupSettings) {
  return request(token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload(settings)),
  })
}
