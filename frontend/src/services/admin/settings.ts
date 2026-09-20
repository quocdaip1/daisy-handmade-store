import { apiUrl } from '../../config/api'
import type { AdminSettings } from '../../types/admin-settings'

interface ApiSettings {
  shop_information: { name: string; email?: string; phone?: string; address?: string; opening_hours?: string }
  bank_account: { bank_name: string; account_number: string; account_owner: string; transfer_prefix: string; qr_image_url?: string | null }
  shipping_methods: Array<{ id: number; name: string; code: string; fee: number | string; free_threshold?: number | string | null; active: boolean }>
  social_links: { facebook?: string; instagram?: string; tiktok?: string; youtube?: string; messenger?: string }
  seo_defaults: { title: string; description?: string; keywords?: string; og_image_url?: string }
}

interface ErrorResponse { message?: string; errors?: Record<string, string[]> }

export class AdminSettingsRequestError extends Error {
  readonly errors: Record<string, string[]>

  constructor(response: ErrorResponse, fallback: string) {
    super(response.message || fallback)
    this.errors = response.errors ?? {}
  }
}

function mapSettings(settings: ApiSettings): AdminSettings {
  return {
    shopInformation: {
      name: settings.shop_information.name,
      email: settings.shop_information.email ?? '',
      phone: settings.shop_information.phone ?? '',
      address: settings.shop_information.address ?? '',
      openingHours: settings.shop_information.opening_hours ?? '',
    },
    bankAccount: {
      bankName: settings.bank_account.bank_name,
      accountNumber: settings.bank_account.account_number,
      accountOwner: settings.bank_account.account_owner,
      transferPrefix: settings.bank_account.transfer_prefix,
      qrImageUrl: settings.bank_account.qr_image_url ?? '',
    },
    shippingMethods: settings.shipping_methods.map((method) => ({
      id: method.id,
      name: method.name,
      code: method.code,
      fee: Number(method.fee),
      freeThreshold: method.free_threshold == null ? undefined : Number(method.free_threshold),
      active: method.active,
    })),
    socialLinks: {
      facebook: settings.social_links.facebook ?? '',
      instagram: settings.social_links.instagram ?? '',
      tiktok: settings.social_links.tiktok ?? '',
      youtube: settings.social_links.youtube ?? '',
      messenger: settings.social_links.messenger ?? '',
    },
    seoDefaults: {
      title: settings.seo_defaults.title,
      description: settings.seo_defaults.description ?? '',
      keywords: settings.seo_defaults.keywords ?? '',
      ogImageUrl: settings.seo_defaults.og_image_url ?? '',
    },
  }
}

function payload(settings: AdminSettings) {
  return {
    shop_information: {
      name: settings.shopInformation.name,
      email: settings.shopInformation.email,
      phone: settings.shopInformation.phone,
      address: settings.shopInformation.address,
      opening_hours: settings.shopInformation.openingHours,
    },
    bank_account: {
      bank_name: settings.bankAccount.bankName,
      account_number: settings.bankAccount.accountNumber,
      account_owner: settings.bankAccount.accountOwner,
      transfer_prefix: settings.bankAccount.transferPrefix,
    },
    shipping_methods: settings.shippingMethods.map((method) => ({
      name: method.name,
      code: method.code,
      fee: method.fee,
      free_threshold: method.freeThreshold ?? null,
      active: method.active,
    })),
    social_links: settings.socialLinks,
    seo_defaults: {
      title: settings.seoDefaults.title,
      description: settings.seoDefaults.description,
      keywords: settings.seoDefaults.keywords,
      og_image_url: settings.seoDefaults.ogImageUrl || null,
    },
  }
}

async function request(token: string, options?: RequestInit, path = '/admin/settings'): Promise<AdminSettings> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const result = contentType.includes('application/json')
    ? await response.json() as { data?: ApiSettings } & ErrorResponse
    : {} as { data?: ApiSettings } & ErrorResponse
  if (!response.ok || !result.data) throw new AdminSettingsRequestError(result, 'Không thể lưu cấu hình cửa hàng.')
  return mapSettings(result.data)
}

export function fetchAdminSettings(token: string) {
  return request(token)
}

export function updateAdminSettings(token: string, settings: AdminSettings) {
  return request(token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload(settings)),
  })
}

export function uploadBankQr(token: string, image: File) {
  const body = new FormData()
  body.append('qr_image', image)

  return request(token, { method: 'POST', body }, '/admin/settings/bank-qr')
}

export function deleteBankQr(token: string) {
  return request(token, { method: 'DELETE' }, '/admin/settings/bank-qr')
}
