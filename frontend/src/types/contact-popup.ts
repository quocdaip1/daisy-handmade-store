export interface FacebookContactSettings {
  displayName: string
  link: string
  enabled: boolean
}

export interface ZaloContactSettings {
  displayName: string
  phone: string
  link: string
  enabled: boolean
}

export interface ContactPopupSettings {
  facebook: FacebookContactSettings
  zalo: ZaloContactSettings
}
