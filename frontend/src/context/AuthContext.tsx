import { createContext, useContext, useEffect, useState } from 'react'
import { authApi, type AuthUser } from '../api/client'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 최초 로드: 기존 세션 복원
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    // 세션 변화(로그아웃/토큰 갱신 등) 구독
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      } else {
        authApi.me().then((u) => setUser(u)).catch(() => setUser(null))
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const u = await authApi.signIn(email, password)
    setUser(u)
    return u
  }

  const logout = () => {
    authApi.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    const u = await authApi.me()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
