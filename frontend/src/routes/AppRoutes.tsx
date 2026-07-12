import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const AboutPage = lazy(() => import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const CartPage = lazy(() => import('../pages/CartPage').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const ContactPage = lazy(() => import('../pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const HomePage = lazy(() => import('../pages/HomePage').then((module) => ({ default: module.HomePage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const OrderHistoryPage = lazy(() => import('../pages/OrderHistoryPage').then((module) => ({ default: module.OrderHistoryPage })))
const PolicyPage = lazy(() => import('../pages/PolicyPage').then((module) => ({ default: module.PolicyPage })))
const ProductsPage = lazy(() => import('../pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="route-loading" aria-live="polite"><span aria-hidden="true">✿</span><p>Đang mở trang...</p></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/san-pham" element={<ProductsPage />} />
        <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/tai-khoan" element={<ProfilePage />} />
        <Route path="/don-hang" element={<OrderHistoryPage />} />
        <Route path="/don-hang/:orderId" element={<OrderHistoryPage />} />
        <Route path="/chinh-sach/:policySlug" element={<PolicyPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
