import { AuthProvider } from './auth/AuthProvider'
import { MainLayout } from './layouts/MainLayout'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </AuthProvider>
  )
}

export default App
