import { useState } from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { updatePassword } from 'firebase/auth'
import FormField from '../../components/FormField'
import { useAuth } from '../../hooks/useAuth'

const DentistProfileScreen = () => {
  const { user, profile, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdatePassword = async () => {
    const trimmedPassword = password.trim()

    if (trimmedPassword.length < 6) {
      Alert.alert('Invalid password', 'Password must be at least 6 characters long.')
      return
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword(user, trimmedPassword)
      setPassword('')
      setConfirmPassword('')
      Alert.alert('Success', 'Password updated successfully.')
    } catch (error) {
      if (error?.code === 'auth/requires-recent-login') {
        Alert.alert('Re-login required', 'Please log out, log in again, and retry password update.')
      } else {
        Alert.alert('Update failed', 'Unable to update password right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Confirm logout', 'Are you sure you want to log out?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, logout', style: 'destructive', onPress: logout },
    ])
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
          <View style={styles.card}>
            <Text style={styles.header}>Dentist Profile</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profile?.name || '-'}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || user?.email || '-'}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>License Number</Text>
              <Text style={styles.infoValue}>{profile?.licenseNumber || 'Not set'}</Text>
            </View>

            <Text style={styles.sectionTitle}>Update Password</Text>
            <FormField
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              secureTextEntry
            />
            <FormField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              secureTextEntry
            />

            <Pressable
              style={[styles.button, styles.updateButton, isSubmitting && styles.disabledButton]}
              onPress={handleUpdatePassword}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Updating...' : 'Update Password'}</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 14,
    paddingTop: 24,
    paddingBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  header: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  infoBlock: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    marginBottom: 12,
    paddingBottom: 10,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  keyboardContainer: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#b91c1c',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 6,
  },
  updateButton: {
    backgroundColor: '#0f766e',
  },
})

export default DentistProfileScreen
