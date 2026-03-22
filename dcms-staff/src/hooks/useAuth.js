import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { addAuditLog } from '../services/logService'

const AuthContext = createContext(null)

const fetchStaffProfile = async (uid) => {
  const staffDoc = await getDoc(doc(db, 'staff', uid))

  if (!staffDoc.exists()) {
    return null
  }

  const profile = staffDoc.data()

  if (profile.status && profile.status.toLowerCase() !== 'active') {
    return null
  }

  return profile
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!isMounted) {
        return
      }

      if (!nextUser) {
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      try {
        const staffProfile = await fetchStaffProfile(nextUser.uid)

        if (!staffProfile) {
          await signOut(auth)
          return
        }

        if (!isMounted) {
          return
        }

        setUser(nextUser)
        setProfile(staffProfile)
      } catch (error) {
        console.error('Failed to restore auth session:', error)
        setUser(null)
        setProfile(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    const staffProfile = await fetchStaffProfile(credential.user.uid)

    if (!staffProfile) {
      await signOut(auth)
      throw new Error('This account is not an active staff account.')
    }

    setUser(credential.user)
    setProfile(staffProfile)
    await addAuditLog(credential.user.uid, 'login', 'auth', credential.user.email || '')
  }

  const logout = async () => {
    const currentUser = auth.currentUser
    if (currentUser) {
      await addAuditLog(currentUser.uid, 'logout', 'auth', currentUser.email || '')
    }
    await signOut(auth)
  }

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [isLoading, profile, user],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
