import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AdminAuthProvider } from './admin/auth/AdminAuthContext'
import { ProtectedRoute } from './admin/auth/ProtectedRoute'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { Login } from './admin/pages/Login/Login'
import { Dashboard } from './admin/pages/Dashboard/Dashboard'
import { Categories } from './admin/pages/Categories/Categories'
import { Products } from './admin/pages/Products/Products'
import { Orders } from './admin/pages/Orders/Orders'
import { Settings } from './admin/pages/Settings/Settings'
import './admin/styles/admin.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AdminAuthProvider>
          <Routes>
            {/* Auth */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected admin routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><AdminLayout><Products /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/delivery" element={<ProtectedRoute><AdminLayout><div>Delivery - coming soon</div></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminLayout><Settings /></AdminLayout></ProtectedRoute>} />

            {/* Redirects */}
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>

          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </AdminAuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App