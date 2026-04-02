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

const isPermissionDeniedError = (error) => {
  return error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied'
}

const isAllowedRole = (role) => {
  return role === 'staff' || role === 'dentist'
}

const fetchUserProfile = async (uid) => {
  const staffDoc = await getDoc(doc(db, 'staff', uid))

  if (!staffDoc.exists()) {
    return null
  }

  const profile = staffDoc.data()
  const role = String(profile.role || 'staff').toLowerCase()

  if (profile.status && profile.status.toLowerCase() !== 'active') {
    return null
  }

  if (!isAllowedRole(role)) {
    return null
  }

  return {
    ...profile,
    role,
    licenseNumber: String(profile.licenseNumber || ''),
  }
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
        const staffProfile = await fetchUserProfile(nextUser.uid)

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
        if (isPermissionDeniedError(error)) {
          console.warn('No Firestore access for this staff account. Signing out.')
          await signOut(auth)
        } else {
          console.warn('Failed to restore auth session.')
        }
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

    try {
      const staffProfile = await fetchUserProfile(credential.user.uid)

      if (!staffProfile) {
        await signOut(auth)
        throw new Error('This account is not an active staff account.')
      }

      setUser(credential.user)
      setProfile(staffProfile)
      await addAuditLog(credential.user.uid, 'login', 'auth', credential.user.email || '')
    } catch (error) {
      await signOut(auth)

      if (isPermissionDeniedError(error)) {
        throw new Error('This account does not have permission to access staff data.')
      }

      throw error
    }
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
