import { AuthProvider } from './auth/AuthProvider'
import { SiteSettingsProvider } from './context/SiteSettingsProvider'
import { MainLayout } from './layouts/MainLayout'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </AuthProvider>
    </SiteSettingsProvider>
  )
}

export default App
