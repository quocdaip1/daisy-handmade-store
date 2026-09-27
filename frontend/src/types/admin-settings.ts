export interface ShopInformationSettings {
  name: string
  email: string
  phone: string
  address: string
  openingHours: string
}

export interface BankAccountSettings {
  bankName: string
  accountNumber: string
  accountOwner: string
  transferPrefix: string
  qrImageUrl: string
}

export interface ShippingMethodSettings {
  id?: number
  name: string
  code: string
  fee: number
  freeThreshold?: number
  active: boolean
}

export interface SocialLinkSettings {
  instagram: string
  tiktok: string
  youtube: string
  contactPopup: ContactPopupSettings
}

export interface SeoDefaultSettings {
  title: string
  description: string
  keywords: string
  ogImageUrl: string
}

export interface AdminSettings {
  shopInformation: ShopInformationSettings
  bankAccount: BankAccountSettings
  shippingMethods: ShippingMethodSettings[]
  socialLinks: SocialLinkSettings
  seoDefaults: SeoDefaultSettings
}
import type { ContactPopupSettings } from './contact-popup'
