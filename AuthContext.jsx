import { createContext, useContext, useState, useEffect } from 'react'
import { authService, userService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    userService
      .getProfile()
      .then((res) => setUser(res.data))
      .catch(() => authService.logout())
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    await authService.login(credentials)
    const res = await userService.getProfile()
    setUser(res.data)
    return res.data
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}
