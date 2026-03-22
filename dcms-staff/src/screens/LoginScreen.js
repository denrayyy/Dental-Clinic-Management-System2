import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'

const LoginScreen = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
    } catch {
      setError('Invalid credentials. Please check your email and password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome back</Text>

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="staff@clinic.com"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleLogin} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    marginBottom: 6,
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
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
    padding: 14,
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
  logo: {
    alignSelf: 'center',
    height: 72,
    marginBottom: 6,
    width: 72,
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
