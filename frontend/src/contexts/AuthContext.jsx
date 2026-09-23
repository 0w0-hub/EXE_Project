import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'homely_access_token'
const MOCK_USER_KEY = 'homely_mock_user'
const MOCK_AUTH_ENABLED = import.meta.env.VITE_MOCK_AUTH === 'true'

const MOCK_USER = {
  id: 'mock-user-001',
  email: 'demo@homely.local',
  fullName: 'Demo Homely',
  role: 'USER',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    if (MOCK_AUTH_ENABLED) {
      const storedUser = localStorage.getItem(MOCK_USER_KEY)
      setUser(storedUser ? JSON.parse(storedUser) : MOCK_USER)
      setLoading(false)
      return
    }

    authApi
      .me()
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function register(payload) {
    if (MOCK_AUTH_ENABLED) {
      const user = {
        ...MOCK_USER,
        fullName: payload.fullName || MOCK_USER.fullName,
        email: payload.email || MOCK_USER.email,
      }
      localStorage.setItem(TOKEN_KEY, 'mock-access-token')
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
      setUser(user)
      return { accessToken: 'mock-access-token', user }
    }

    const data = await authApi.register(payload)
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    setUser(data.user)
    return data
  }

  async function login(payload) {
    if (MOCK_AUTH_ENABLED) {
      const user = { ...MOCK_USER, email: payload.email || MOCK_USER.email }
      localStorage.setItem(TOKEN_KEY, 'mock-access-token')
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
      setUser(user)
      return { accessToken: 'mock-access-token', user }
    }

    const data = await authApi.login(payload)
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    setUser(data.user)
    return data
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(MOCK_USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải được dùng trong AuthProvider')
  }
  return ctx
}
