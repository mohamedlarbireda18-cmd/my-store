import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from './admin/auth/AdminAuthContext'
import { ProtectedRoute } from './admin/auth/ProtectedRoute'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { Login } from './admin/pages/Login/Login'
import { ResetPassword } from './admin/pages/ResetPassword/ResetPassword'
import { Dashboard } from './admin/pages/Dashboard/Dashboard'
import { Categories } from './admin/pages/Categories/Categories'
import { Products } from './admin/pages/Products/Products'
import { ProductForm } from './admin/pages/Products/ProductForm'
import { Orders } from './admin/pages/Orders/Orders'
import { OrderDetail } from './admin/pages/Orders/OrderDetail'
import { Settings } from './admin/pages/Settings/Settings'
import { CartProvider } from './customer/context/CartContext'
import { FavoritesProvider } from './customer/context/FavoritesContext'
import { CustomerLayout } from './customer/layouts/CustomerLayout'
import { Home } from './customer/pages/Home/Home'
import { Products as PublicProducts } from './customer/pages/Products/Products'
import { Categories as PublicCategories } from './customer/pages/Categories/Categories'

import './admin/styles/admin.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AdminAuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Routes>
                {/* ==============================
                    Admin routes
                ============================== */}
                <Route path="/admin/login" element={<Login />} />
                <Route
                  path="/admin/reset-password"
                  element={<ResetPassword />}
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Dashboard />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Orders />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/:id"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <OrderDetail />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Categories />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Products />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products/new"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <ProductForm />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products/:id/edit"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <ProductForm />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/delivery"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <div style={{ padding: 40, textAlign: 'center' }}>
                          Delivery settings coming soon
                        </div>
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute>
                      <AdminLayout>
                        <Settings />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={<Navigate to="/admin" replace />}
                />

                {/* ==============================
                    Customer storefront
                ============================== */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<PublicProducts />} />
                  <Route path="/categories" element={<PublicCategories />} />
                  <Route
                    path="/products/:slug"
                    element={
                      <div style={{ padding: 60, textAlign: 'center' }}>
                        Product detail coming soon
                      </div>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <div style={{ padding: 60, textAlign: 'center' }}>
                        Cart coming soon
                      </div>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <div style={{ padding: 60, textAlign: 'center' }}>
                        Checkout coming soon
                      </div>
                    }
                  />
                  <Route
                    path="/order/:orderNumber"
                    element={
                      <div style={{ padding: 60, textAlign: 'center' }}>
                        Order confirmation coming soon
                      </div>
                    }
                  />
                </Route>
              </Routes>

              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: { background: '#363636', color: '#fff' },
                }}
              />
            </FavoritesProvider>
          </CartProvider>
        </AdminAuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App