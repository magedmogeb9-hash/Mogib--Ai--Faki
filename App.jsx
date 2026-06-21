import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import NewProjectPage from './pages/NewProjectPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import ContractsPage from './pages/ContractsPage'
import AppLayout from './components/AppLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lab-void">
      <div className="font-mono text-signal-phosphor text-sm animate-pulse">
        جارٍ تحميل المختبر...
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects/new" element={<NewProjectPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
