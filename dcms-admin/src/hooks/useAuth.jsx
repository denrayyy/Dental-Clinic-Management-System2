import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadingTimeoutId = setTimeout(() => {
      console.warn('Auth initialization timed out. Continuing without session state.')
      setIsLoading(false)
    }, 6000)

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        clearTimeout(loadingTimeoutId)
        setUser(nextUser)
        setIsLoading(false)
      },
      (authError) => {
        clearTimeout(loadingTimeoutId)
        console.error('Failed to initialize authentication state.', authError)
        setUser(null)
        setIsLoading(false)
      },
    )

    return () => {
      clearTimeout(loadingTimeoutId)
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    await signOut(auth)
  }

  const contextValue = useMemo(
    () => ({ user, isLoading, logout }),
    [user, isLoading],
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
