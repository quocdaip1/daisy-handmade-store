import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { SeoManager } from '../components/SeoManager'

interface MainLayoutProps { children: ReactNode }

export function MainLayout({ children }: MainLayoutProps) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return <div className="app-shell"><SeoManager /><Header /><main className="page-content">{children}</main><Footer /></div>
}
