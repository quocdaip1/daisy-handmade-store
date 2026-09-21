import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedAdminRoute } from './ProtectedAdminRoute'
import { adminContentFeatures } from '../config/adminContentFeatures'

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
const AdminLayout = lazy(() => import('../layouts/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProductManagementPage = lazy(() => import('../pages/admin/ProductManagementPage').then((module) => ({ default: module.ProductManagementPage })))
const CategoryManagementPage = lazy(() => import('../pages/admin/CategoryManagementPage').then((module) => ({ default: module.CategoryManagementPage })))
const OrderListPage = lazy(() => import('../pages/admin/OrderListPage').then((module) => ({ default: module.OrderListPage })))
const OrderDetailPage = lazy(() => import('../pages/admin/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })))
const CustomerListPage = lazy(() => import('../pages/admin/CustomerListPage').then((module) => ({ default: module.CustomerListPage })))
const CustomerDetailPage = lazy(() => import('../pages/admin/CustomerDetailPage').then((module) => ({ default: module.CustomerDetailPage })))
const CouponManagementPage = lazy(() => import('../pages/admin/CouponManagementPage').then((module) => ({ default: module.CouponManagementPage })))
const BannerManagementPage = lazy(() => import('../pages/admin/BannerManagementPage').then((module) => ({ default: module.BannerManagementPage })))
const ContactManagementPage = lazy(() => import('../pages/admin/ContactManagementPage').then((module) => ({ default: module.ContactManagementPage })))
const PolicyManagementPage = lazy(() => import('../pages/admin/PolicyManagementPage').then((module) => ({ default: module.PolicyManagementPage })))
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage').then((module) => ({ default: module.SettingsPage })))

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
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductManagementPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="coupons" element={<CouponManagementPage />} />
            <Route path="content/banners" element={adminContentFeatures.banners ? <BannerManagementPage /> : <Navigate to="/admin" replace />} />
            <Route path="content/contacts" element={adminContentFeatures.contacts ? <ContactManagementPage /> : <Navigate to="/admin" replace />} />
            <Route path="content/policies" element={adminContentFeatures.policies ? <PolicyManagementPage /> : <Navigate to="/admin" replace />} />
            {['banner', 'banners', 'contact', 'contacts', 'policy', 'policies'].map((path) => (
              <Route key={path} path={path} element={<Navigate to="/admin" replace />} />
            ))}
            <Route path="content/*" element={<Navigate to="/admin" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
