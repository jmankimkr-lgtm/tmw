import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import PlannerPage from './pages/PlannerPage'
import HistoryPage from './pages/HistoryPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminDetailPage from './pages/AdminDetailPage'
import ProfilePage from './pages/ProfilePage'

function PrivateRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'member' }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-400">로딩 중...</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/planner'} replace />
  }
  return <>{children}</>
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <p className="text-gray-500 mt-2 text-sm">Phase 3에서 개발됩니다.</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/planner" element={
        <PrivateRoute role="member"><PlannerPage /></PrivateRoute>
      } />
      <Route path="/planner/:date" element={
        <PrivateRoute role="member"><PlannerPage /></PrivateRoute>
      } />
      <Route path="/history" element={
        <PrivateRoute role="member"><HistoryPage /></PrivateRoute>
      } />
      <Route path="/admin" element={
        <PrivateRoute role="admin"><AdminDashboardPage /></PrivateRoute>
      } />
      <Route path="/admin/detail" element={
        <PrivateRoute role="admin"><AdminDetailPage /></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><ProfilePage /></PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
