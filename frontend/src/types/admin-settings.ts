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
  facebook: string
  instagram: string
  tiktok: string
  youtube: string
  messenger: string
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
