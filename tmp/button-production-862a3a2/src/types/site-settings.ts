import type { ContactPopupSettings } from './contact-popup'

export interface SiteSettings {
  shopInformation: {
    name: string
    email: string
    phone: string
    address: string
    openingHours: string
  }
  socialLinks: {
    instagram: string
    tiktok: string
    youtube: string
    contactPopup: ContactPopupSettings
  }
  seoDefaults: {
    title: string
    description: string
    keywords: string
    ogImageUrl: string
  }
}
