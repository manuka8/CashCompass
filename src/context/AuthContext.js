import { createContext, useEffect, useState } from "react"
import { api, normalizeUser } from "../services/api"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await api.getToken()
        if (token) {
          const storedUser = await api.getStoredUser()
          if (storedUser) {
            setUser(normalizeUser(storedUser))
          }
          // Verify with backend
          try {
            const freshUser = await api.auth.getMe()
            if (freshUser) {
              const normalized = normalizeUser(freshUser)
              setUser(normalized)
              await api.saveUser(normalized)
            }
          } catch {
            // If token invalid, clear session
            // await api.clearSession()
            // setUser(null)
          }
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    const response = await api.auth.login({ email, password })
    if (response?.accessToken && response?.user) {
      await api.setToken(response.accessToken)
      const normalized = normalizeUser(response.user)
      setUser(normalized)
      await api.saveUser(normalized)
    }
    return response
  }

  const register = async (data) => {
    const response = await api.auth.register(data)
    return response
  }

  const logout = async () => {
    await api.clearSession()
    setUser(null)
  }

  const updateUser = async (updatedData) => {
    const normalized = normalizeUser({ ...user, ...updatedData })
    setUser(normalized)
    await api.saveUser(normalized)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
