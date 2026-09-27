import { apiUrl } from '../config/api'
import { mapContactPopup, type ApiContactPopupSettings } from './contact-popup'
import type { SiteSettings } from '../types/site-settings'

interface ApiSiteSettings {
  shop_information: { name?: string; email?: string; phone?: string; address?: string; opening_hours?: string }
  social_links: { instagram?: string; tiktok?: string; youtube?: string; contact_popup?: ApiContactPopupSettings }
  seo_defaults: { title?: string; description?: string; keywords?: string; og_image_url?: string }
}

const emptyContactPopup: ApiContactPopupSettings = {
  facebook: { display_name: '', link: '', enabled: false },
  zalo: { display_name: '', phone: '', link: '', enabled: false },
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const response = await fetch(apiUrl('/site-settings'), { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error('Không thể tải cấu hình website.')
  const { data } = await response.json() as { data: ApiSiteSettings }

  return {
    shopInformation: {
      name: data.shop_information.name ?? 'Daisy Handmade Store',
      email: data.shop_information.email ?? '',
      phone: data.shop_information.phone ?? '',
      address: data.shop_information.address ?? '',
      openingHours: data.shop_information.opening_hours ?? '',
    },
    socialLinks: {
      instagram: data.social_links.instagram ?? '',
      tiktok: data.social_links.tiktok ?? '',
      youtube: data.social_links.youtube ?? '',
      contactPopup: mapContactPopup(data.social_links.contact_popup ?? emptyContactPopup),
    },
    seoDefaults: {
      title: data.seo_defaults.title ?? 'Daisy Handmade Store',
      description: data.seo_defaults.description ?? '',
      keywords: data.seo_defaults.keywords ?? '',
      ogImageUrl: data.seo_defaults.og_image_url ?? '',
    },
  }
}
