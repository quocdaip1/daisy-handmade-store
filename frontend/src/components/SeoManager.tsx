import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import logo from '../assets/daisy-logo.webp'
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

  useEffect(() => {
    const route = getRouteMetadata(pathname)
    const canonicalUrl = new URL(pathname, window.location.origin).href
    const logoUrl = new URL(logo, window.location.origin).href

    document.title = route.title
    setMeta('meta[name="description"]', 'name', 'description', route.description)
    setMeta('meta[name="robots"]', 'name', 'robots', route.robots ?? 'index, follow')
    setMeta('meta[property="og:title"]', 'property', 'og:title', route.title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', route.description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'vi_VN')
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Daisy Handmade Store')
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:image"]', 'property', 'og:image', logoUrl)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')

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
      { '@type': 'Organization', '@id': `${window.location.origin}/#organization`, name: 'Daisy Handmade Store', url: window.location.origin, logo: logoUrl, telephone: '+84349671134' },
      { '@type': 'WebSite', '@id': `${window.location.origin}/#website`, name: 'Daisy Handmade Store', url: window.location.origin, inLanguage: 'vi-VN', publisher: { '@id': `${window.location.origin}/#organization` } },
      { '@type': 'WebPage', name: route.title, description: route.description, url: canonicalUrl, inLanguage: 'vi-VN', isPartOf: { '@id': `${window.location.origin}/#website` } },
    ] })
  }, [pathname])

  return null
}
