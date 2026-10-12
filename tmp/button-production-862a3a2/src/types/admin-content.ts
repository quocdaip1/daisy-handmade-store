export type BannerPosition = 0 | 1

export interface AdminBanner {
  id: number
  title: string
  image: string
  link: string
  position: BannerPosition
  active: boolean
}

export interface AdminBannerFormValues {
  title: string
  image: string
  link: string
  position: BannerPosition
  active: boolean
}

export interface AdminContact {
  id: number
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: string
  createdAt: string
}

export interface AdminContactCatalog {
  contacts: AdminContact[]
  currentPage: number
  lastPage: number
  total: number
}

export interface AdminPolicy {
  id: number
  title: string
  slug: string
  content: string
  version: number
  published: boolean
  updatedAt: string
}

export interface AdminPolicyFormValues {
  title: string
  slug: string
  content: string
  version: number
  published: boolean
}
