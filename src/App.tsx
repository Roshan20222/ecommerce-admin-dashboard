import { Suspense, lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './components/auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AppErrorBoundary } from './components/ui/AppErrorBoundary'
import { ComingSoonPage } from './pages/ComingSoonPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppErrorBoundary>
          <Toaster richColors position="top-right" />
          <Routes>
          <Route
            path="/login"
            element={
              <Suspense
                fallback={
                  <p className="p-8 text-sm text-slate-500">Loading sign in...</p>
                }
              >
                <LoginPage />
              </Suspense>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route
                index
                element={
                  <Suspense
                    fallback={
                      <p className="text-sm text-slate-500">Loading dashboard...</p>
                    }
                  >
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="products"
                element={
                  <Suspense
                    fallback={
                      <p className="text-sm text-slate-500">Loading products...</p>
                    }
                  >
                    <ProductsPage />
                  </Suspense>
                }
              />
              <Route
                path="orders"
                element={
                  <Suspense
                    fallback={
                      <p className="text-sm text-slate-500">Loading orders...</p>
                    }
                  >
                    <OrdersPage />
                  </Suspense>
                }
              />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route
                  path="users"
                  element={
                    <Suspense
                      fallback={
                        <p className="text-sm text-slate-500">Loading users...</p>
                      }
                    >
                      <UsersPage />
                    </Suspense>
                  }
                />
              </Route>
              <Route path="analytics" element={<ComingSoonPage title="Analytics" />} />
            </Route>
          </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppErrorBoundary>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
