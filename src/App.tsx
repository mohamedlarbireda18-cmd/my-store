import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from './features/auth/AdminAuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminLogin } from './pages/admin/AdminLogin'
import { Categories } from './pages/admin/Categories'

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
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <div>Dashboard (coming soon)</div>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <div>Products (coming soon)</div>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <div>Orders (coming soon)</div>
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
                path="/admin/delivery"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <div>Delivery Settings (coming soon)</div>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <div>Settings (coming soon)</div>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirects */}
              <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>

            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </AdminAuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App