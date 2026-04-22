import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'

const getLoginErrorMessage = (error) => {
  const code = error?.code || ''
  const rawMessage = String(error?.message || '').toLowerCase()

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid credentials. Please check your email and password.'
  }

  if (code === 'auth/user-not-found') {
    return 'No account found for this email.'
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.'
  }

  if (rawMessage.includes('permission') || rawMessage.includes('staff') || rawMessage.includes('role')) {
    return 'Your account is not allowed to sign in to this app.'
  }

  return 'Unable to sign in right now. Please try again.'
}

const getResetPasswordErrorMessage = (error) => {
  const code = error?.code || ''

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.'
  }

  if (code === 'auth/user-not-found') {
    return 'No account found for this email address.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is disabled in Firebase Auth settings.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many requests. Please try again later.'
  }

  if (code === 'auth/expired-action-code') {
    return 'Reset code has expired. Request a new reset email.'
  }

  if (code === 'auth/invalid-action-code') {
    return 'Reset code is invalid. Double-check it or request a new reset email.'
  }

  if (code === 'auth/weak-password') {
    return 'Please choose a stronger new password.'
  }

  return 'Unable to send reset link right now. Please try again.'
}

const LoginScreen = () => {
  const navigation = useNavigation()
  const { login, forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isResetModalVisible, setIsResetModalVisible] = useState(false)

  const handleLogin = async () => {
    setError('')
    setResetMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password)
    } catch (error) {
      setError(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setResetMessage('')

    const normalizedEmail = (resetEmail || email).trim()
    if (!normalizedEmail) {
      setError('Enter your email first to receive a reset link.')
      return
    }

    setIsResettingPassword(true)

    try {
      await forgotPassword(normalizedEmail)
      setResetEmail(normalizedEmail)
      setResetMessage('Reset link sent. Please check your email inbox.')
      setIsResetModalVisible(false)
    } catch (resetError) {
      setError(getResetPasswordErrorMessage(resetError))
    } finally {
      setIsResettingPassword(false)
    }
  }

  const openResetModal = () => {
    setError('')
    setResetMessage('')
    setResetEmail(email.trim())
    setIsResetModalVisible(true)
  }

  const closeResetModal = () => {
    setIsResetModalVisible(false)
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require('../../assets/logo.png')} style={styles.logoTop} resizeMode="contain" />
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>

            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="staff@clinic.com"
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputLight}
              inputTextColor="#0f172a"
              inputPlaceholderColor="#94a3b8"
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputLight}
              inputTextColor="#0f172a"
              inputPlaceholderColor="#94a3b8"
            />

            <Pressable onPress={openResetModal}>
              <Text style={styles.forgotPasswordLink}>
                Forgot password?
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {resetMessage ? <Text style={styles.resetSuccess}>{resetMessage}</Text> : null}

            <Pressable style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            <Text style={styles.legalText}>
              By logging in, you agree to the
              <Text style={styles.linkText} onPress={() => navigation.navigate('TermsScreen', { docType: 'terms' })}> Terms and Conditions</Text>
              {' '}and
              <Text style={styles.linkText} onPress={() => navigation.navigate('TermsScreen', { docType: 'privacy' })}> Privacy Policy</Text>
              .
            </Text>
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent
          visible={isResetModalVisible}
          onRequestClose={closeResetModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Reset Password</Text>

              <Text style={styles.modalSubtitle}>Enter your email to receive a reset link.</Text>
              <FormField
                label="Email"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="staff@clinic.com"
                labelStyle={styles.inputLabel}
                inputStyle={styles.inputLight}
                inputTextColor="#0f172a"
                inputPlaceholderColor="#94a3b8"
              />
              <Pressable style={styles.resetButton} onPress={handleForgotPassword} disabled={isResettingPassword}>
                {isResettingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </Pressable>

              <Pressable onPress={closeResetModal}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    marginBottom: 18,
    marginTop: 2,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: '100%',
  },
  keyboardContainer: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  inputLabel: {
    color: '#334155',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  legalText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
    textAlign: 'center',
  },
  linkText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 14,
    paddingTop: 150,
  },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-start',
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
    textAlign: 'left',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxWidth: 420,
    padding: 16,
    width: '100%',
  },
  modalCloseText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#0c4a6e',
    borderRadius: 10,
    marginTop: 4,
    paddingVertical: 11,
  },
  logoTop: {
    alignSelf: 'center',
    height: 72,
    marginBottom: 2,
    width: 72,
  },
  resetSuccess: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    color: '#166534',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
})

export default LoginScreen
