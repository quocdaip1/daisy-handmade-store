import { createContext, useContext } from 'react'
import type { SiteSettings } from '../types/site-settings'

export const SiteSettingsContext = createContext<SiteSettings | null>(null)

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
