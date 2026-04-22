import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native'
import { useAuth } from './useAuth'

const ThemeContext = createContext(null)

const lightColors = {
  inputBg: '#fff',
  inputBorder: '#cbd5e1',
  inputPlaceholder: '#94a3b8',
  inputText: '#0f172a',
  labelText: '#334155',
  line: '#e2e8f0',
  modalBg: '#fff',
  modalCancelBg: '#e2e8f0',
  modalCancelText: '#1e293b',
  mutedText: '#64748b',
  nameText: '#334155',
  panelBg: '#fff',
  screenBg: '#f8fafc',
  sectionBg: '#f8fafc',
  secondaryText: '#94a3b8',
  strongText: '#0f172a',
  subtleIcon: '#334155',
  tabInactive: '#64748b',
  dangerBg: '#fee2e2',
  dangerText: '#b91c1c',
}

const darkColors = {
  inputBg: '#0f172a',
  inputBorder: '#334155',
  inputPlaceholder: '#64748b',
  inputText: '#e2e8f0',
  labelText: '#cbd5e1',
  line: '#334155',
  modalBg: '#111827',
  modalCancelBg: '#334155',
  modalCancelText: '#e2e8f0',
  mutedText: '#94a3b8',
  nameText: '#f8fafc',
  panelBg: '#111827',
  screenBg: '#020617',
  sectionBg: '#0f172a',
  secondaryText: '#94a3b8',
  strongText: '#e2e8f0',
  subtleIcon: '#cbd5e1',
  tabInactive: '#94a3b8',
  dangerBg: '#3f1d1d',
  dangerText: '#fecaca',
}

const getThemeStorageKey = (uid) => `appThemeMode:${uid || 'guest'}`

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isThemeReady, setIsThemeReady] = useState(false)

  const storageKey = useMemo(() => getThemeStorageKey(user?.uid), [user?.uid])

  useEffect(() => {
    let isMounted = true

    const loadThemePreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(storageKey)
        if (isMounted) {
          setIsDarkMode(storedValue === '1')
        }
      } catch {
        if (isMounted) {
          setIsDarkMode(false)
        }
      } finally {
        if (isMounted) {
          setIsThemeReady(true)
        }
      }
    }

    setIsThemeReady(false)
    loadThemePreference()

    return () => {
      isMounted = false
    }
  }, [storageKey])

  const setDarkMode = async (nextValue) => {
    setIsDarkMode(nextValue)

    try {
      await AsyncStorage.setItem(storageKey, nextValue ? '1' : '0')
    } catch {
      // Keep UI responsive even if persistence fails.
    }
  }

  const toggleDarkMode = async () => {
    await setDarkMode(!isDarkMode)
  }

  const colors = isDarkMode ? darkColors : lightColors

  const navigationTheme = useMemo(
    () => ({
      ...NavigationDefaultTheme,
      colors: {
        ...NavigationDefaultTheme.colors,
        background: colors.screenBg,
        border: colors.line,
        card: colors.panelBg,
        primary: '#0f766e',
        text: colors.strongText,
      },
    }),
    [colors],
  )

  const value = useMemo(
    () => ({
      colors,
      isDarkMode,
      isThemeReady,
      navigationTheme,
      setDarkMode,
      toggleDarkMode,
    }),
    [colors, isDarkMode, isThemeReady, navigationTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
