import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '../context/SiteSettingsContext'
import logo from '../assets/daisy-logo.webp'
import { features } from '../config/features'
import { getRouteMetadata } from '../seo/routeMetadata'

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export function SeoManager() {
  const { pathname } = useLocation()
  const siteSettings = useSiteSettings()

  useEffect(() => {
    const seoDefaults = features.dynamicSeoSettings ? siteSettings?.seoDefaults : undefined
    const route = getRouteMetadata(pathname, seoDefaults)
    const canonicalUrl = new URL(pathname, window.location.origin).href
    const logoUrl = new URL(logo, window.location.origin).href
    const imageUrl = seoDefaults?.ogImageUrl || logoUrl
    const siteName = siteSettings?.shopInformation.name || 'Daisy Handmade Store'

    document.title = route.title
    setMeta('meta[name="description"]', 'name', 'description', route.description)
    setMeta('meta[name="keywords"]', 'name', 'keywords', seoDefaults?.keywords || '')
    setMeta('meta[name="robots"]', 'name', 'robots', route.robots ?? 'index, follow')
    setMeta('meta[property="og:title"]', 'property', 'og:title', route.title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', route.description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'vi_VN')
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', siteName)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', imageUrl === logoUrl ? 'summary' : 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', route.title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', route.description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    let script = document.head.querySelector<HTMLScriptElement>('#daisy-structured-data')
    if (!script) {
      script = document.createElement('script')
      script.id = 'daisy-structured-data'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.text = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${window.location.origin}/#organization`, name: siteName, url: window.location.origin, logo: imageUrl, telephone: siteSettings?.shopInformation.phone || undefined, email: siteSettings?.shopInformation.email || undefined },
      { '@type': 'WebSite', '@id': `${window.location.origin}/#website`, name: siteName, url: window.location.origin, inLanguage: 'vi-VN', publisher: { '@id': `${window.location.origin}/#organization` } },
      { '@type': 'WebPage', name: route.title, description: route.description, url: canonicalUrl, inLanguage: 'vi-VN', isPartOf: { '@id': `${window.location.origin}/#website` } },
    ] })
  }, [pathname, siteSettings])

  return null
}
