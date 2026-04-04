import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth, db } from '../firebase/config'
import { addAuditLog } from '../services/logService'

const AuthContext = createContext(null)

const isPermissionDeniedError = (error) => {
  return error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied'
}

const isAllowedRole = (role) => {
  return role === 'staff' || role === 'dentist'
}

const getTermsStorageKey = (uid) => `termsAccepted:${uid}`

const hasLocalTermsAcceptance = async (uid) => {
  const value = await AsyncStorage.getItem(getTermsStorageKey(uid))
  return value === '1'
}

const markLocalTermsAcceptance = async (uid) => {
  await AsyncStorage.setItem(getTermsStorageKey(uid), '1')
}

const fetchUserProfile = async (uid) => {
  const staffDoc = await getDoc(doc(db, 'staff', uid))

  if (!staffDoc.exists()) {
    return null
  }

  const profile = staffDoc.data()
  const role = String(profile.role || 'staff').toLowerCase()
  const localAccepted = await hasLocalTermsAcceptance(uid)

  if (profile.status && profile.status.toLowerCase() !== 'active') {
    return null
  }

  if (!isAllowedRole(role)) {
    return null
  }

  const backendAccepted =
    typeof profile.isFirstLogin === 'boolean'
      ? !profile.isFirstLogin
      : Boolean(profile.termsAcceptedAt)

  return {
    ...profile,
    role,
    licenseNumber: String(profile.licenseNumber || ''),
    isFirstLogin: !(backendAccepted || localAccepted),
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false)

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

  const acceptTermsAndContinue = async () => {
    const currentUser = auth.currentUser

    if (!currentUser) {
      return
    }

    setIsAcceptingTerms(true)

    try {
      try {
        await markLocalTermsAcceptance(currentUser.uid)
      } catch (error) {
        console.warn('Unable to persist terms acceptance locally.', error?.code || '')
      }

      setProfile((prev) => {
        if (!prev) {
          return prev
        }

        return {
          ...prev,
          isFirstLogin: false,
        }
      })
    } finally {
      setIsAcceptingTerms(false)
    }
  }

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: Boolean(user),
      requiresTermsAcceptance: Boolean(user && profile?.isFirstLogin),
      isAcceptingTerms,
      login,
      logout,
      acceptTermsAndContinue,
    }),
    [acceptTermsAndContinue, isAcceptingTerms, isLoading, profile, user],
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
