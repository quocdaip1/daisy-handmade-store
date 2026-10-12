import { useEffect, useState, type ReactNode } from 'react'
import { fetchSiteSettings } from '../services/site-settings'
import type { SiteSettings } from '../types/site-settings'
import { SiteSettingsContext } from './SiteSettingsContext'

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    let active = true
    void fetchSiteSettings().then((result) => { if (active) setSettings(result) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}
