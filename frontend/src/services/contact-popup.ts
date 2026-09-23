import { apiUrl } from '../config/api'
import type { ContactPopupSettings } from '../types/contact-popup'

interface ApiContactPopupSettings {
  facebook?: { display_name?: string; link?: string; enabled?: boolean }
  zalo?: { display_name?: string; phone?: string; link?: string; enabled?: boolean }
}

export function mapContactPopup(settings: ApiContactPopupSettings): ContactPopupSettings {
  return {
    facebook: {
      displayName: settings.facebook?.display_name ?? '',
      link: settings.facebook?.link ?? '',
      enabled: settings.facebook?.enabled ?? false,
    },
    zalo: {
      displayName: settings.zalo?.display_name ?? '',
      phone: settings.zalo?.phone ?? '',
      link: settings.zalo?.link ?? '',
      enabled: settings.zalo?.enabled ?? false,
    },
  }
}

export async function fetchContactPopup(): Promise<ContactPopupSettings> {
  const response = await fetch(apiUrl('/contact-popup'), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Không thể tải thông tin hỗ trợ.')
  const result = await response.json() as { data: ApiContactPopupSettings }
  return mapContactPopup(result.data)
}
