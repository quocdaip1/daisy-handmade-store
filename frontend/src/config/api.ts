const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || '/api').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Public-disk paths follow the API origin; frontend assets keep their own origin.
export function productImageUrl(path: string): string {
  if (!path.startsWith('/storage/')) return path
  if (API_BASE_URL.startsWith('/')) return path
  return new URL(path, new URL(API_BASE_URL, window.location.origin)).href
}

export function productImagePath(url: string): string {
  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
  const image = new URL(url, window.location.origin)
  return image.origin === apiOrigin && image.pathname.startsWith('/storage/')
    ? `${image.pathname}${image.search}`
    : url
}
