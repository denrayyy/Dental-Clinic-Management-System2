import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import FormField from '../../components/FormField'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const toTitleCase = (value) => {
  const text = String(value || '').trim()
  if (!text) {
    return '-'
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

const getRoleLabel = (role) => {
  const normalized = String(role || '').toLowerCase()
  return toTitleCase(normalized || 'dentist')
}

const getInitials = (name, email) => {
  const fullName = String(name || '').trim()

  if (fullName) {
    const parts = fullName.split(/\s+/).slice(0, 2)
    return parts.map((part) => part.charAt(0).toUpperCase()).join('')
  }

  return String(email || 'U').charAt(0).toUpperCase()
}

const DentistProfileScreen = () => {
  const insets = useSafeAreaInsets()
  const { user, profile, logout } = useAuth()
  const { colors: theme, isDarkMode, setDarkMode } = useTheme()
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarUri, setAvatarUri] = useState('')
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const displayName = profile?.name || user?.displayName || 'Dentist User'
  const displayEmail = profile?.email || user?.email || '-'
  const userInitials = getInitials(displayName, displayEmail)
  const avatarStorageKey = `profileAvatar:${user?.uid || 'guest'}:dentist`

  useEffect(() => {
    let isMounted = true

    const loadAvatar = async () => {
      try {
        const storedUri = await AsyncStorage.getItem(avatarStorageKey)
        if (isMounted) {
          setAvatarUri(storedUri || '')
        }
      } catch {
        if (isMounted) {
          setAvatarUri('')
        }
      }
    }

    loadAvatar()

    return () => {
      isMounted = false
    }
  }, [avatarStorageKey])

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true))
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false))

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  const profileRows = useMemo(() => {
    return [
      { label: 'Email', value: displayEmail },
      { label: 'License Number', value: profile?.licenseNumber || 'Not set' },
      { label: 'Clinic Name', value: 'Cudal Blanco Dental Clinic' },
      { label: 'Address', value: 'Magsaysay Street, Malaybalay City, Bukidnon' },
    ]
  }, [displayEmail, profile?.licenseNumber])

  const closePasswordModal = () => {
    if (isSubmitting) {
      return
    }

    setIsPasswordModalVisible(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleChangePassword = async () => {
    const trimmedCurrent = currentPassword.trim()
    const trimmedNew = newPassword.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedCurrent) {
      Alert.alert('Missing current password', 'Please enter your current password.')
      return
    }

    if (trimmedNew.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters long.')
      return
    }

    if (trimmedNew !== trimmedConfirm) {
      Alert.alert('Password mismatch', 'New password and confirm password do not match.')
      return
    }

    if (!user || !user.email) {
      Alert.alert('Account error', 'Unable to verify this account. Please log in again.')
      return
    }

    setIsSubmitting(true)

    try {
      const credential = EmailAuthProvider.credential(user.email, trimmedCurrent)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, trimmedNew)

      closePasswordModal()
      Alert.alert('Success', 'Your password has been updated.')
    } catch (error) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        Alert.alert('Invalid current password', 'The current password you entered is incorrect.')
      } else if (error?.code === 'auth/weak-password') {
        Alert.alert('Weak password', 'Please choose a stronger password.')
      } else if (error?.code === 'auth/too-many-requests') {
        Alert.alert('Too many attempts', 'Please try again after a few minutes.')
      } else if (error?.code === 'auth/requires-recent-login') {
        Alert.alert('Re-login required', 'Please log out and log back in, then try again.')
      } else {
        Alert.alert('Update failed', 'Unable to update password right now. Please try again.')
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

  const handleEditAvatar = async () => {
    if (isUpdatingAvatar) {
      return
    }

    setIsUpdatingAvatar(true)

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to upload a profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (result.canceled || !result.assets?.length) {
        return
      }

      const nextUri = result.assets[0].uri
      setAvatarUri(nextUri)
      await AsyncStorage.setItem(avatarStorageKey, nextUri)
    } catch {
      Alert.alert('Upload failed', 'Unable to update profile photo right now.')
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleDarkModeChange = async (nextValue) => {
    await setDarkMode(nextValue)
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={[styles.keyboardContainer, { backgroundColor: theme.screenBg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom + 10, 12) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.profileCard, { backgroundColor: theme.panelBg, borderColor: theme.line }]}>
            <View style={[styles.heroCard, { backgroundColor: theme.sectionBg }]}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{userInitials}</Text>
                  </View>
                )}
                <Pressable
                  style={[
                    styles.avatarEditButton,
                    { backgroundColor: theme.panelBg, borderColor: theme.line },
                    isUpdatingAvatar && styles.disabledButton,
                  ]}
                  onPress={handleEditAvatar}
                  disabled={isUpdatingAvatar}
                >
                  <Ionicons name="create-outline" size={12} color={theme.subtleIcon} />
                </Pressable>
              </View>

              <Text style={[styles.heroName, { color: theme.nameText }]}>{displayName}</Text>
              <Text style={[styles.heroRole, { color: theme.secondaryText }]}>{getRoleLabel(profile?.role)}</Text>
              <View style={styles.heroAccent} />
            </View>

            <View style={styles.infoSection}>
              <View style={[styles.themeToggleRow, { borderBottomColor: theme.line }]}>
                <View style={styles.themeToggleTextWrap}>
                  <Text style={[styles.infoLabel, { color: theme.labelText, marginBottom: 2 }]}>Theme</Text>
                  <Text style={[styles.themeToggleHint, { color: theme.mutedText }]}>Enable dark mode</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleDarkModeChange}
                  thumbColor={isDarkMode ? '#99f6e4' : '#ffffff'}
                  trackColor={{ false: '#cbd5e1', true: '#0f766e' }}
                />
              </View>

              {profileRows.map((item) => (
                <View style={[styles.infoRow, { borderBottomColor: theme.line }]} key={item.label}>
                  <Text style={[styles.infoLabel, { color: theme.labelText }]}>{item.label}</Text>
                  <Text style={[styles.infoValue, { color: theme.strongText }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionsWrap}>
              <Pressable
                style={[styles.button, styles.updateButton]}
                onPress={() => setIsPasswordModalVisible(true)}
              >
                <Text style={styles.buttonText}>Change Password</Text>
              </Pressable>

              <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={isPasswordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closePasswordModal}
        >
          <KeyboardAvoidingView
            style={styles.modalKeyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
          >
            <View
              style={[
                styles.modalBackdrop,
                isKeyboardVisible && {
                  justifyContent: 'flex-start',
                  paddingTop: Math.max(insets.top + 28, 36),
                },
              ]}
            >
              <View style={[styles.modalCard, { backgroundColor: theme.modalBg, borderColor: theme.line }]}>
                <Text style={[styles.modalTitle, { color: theme.strongText }]}>Change Password</Text>

                <FormField
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  inputStyle={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}
                  labelStyle={{ color: theme.labelText }}
                  inputTextColor={theme.inputText}
                  inputPlaceholderColor={theme.inputPlaceholder}
                  secureTextEntry
                />
                <FormField
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  inputStyle={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}
                  labelStyle={{ color: theme.labelText }}
                  inputTextColor={theme.inputText}
                  inputPlaceholderColor={theme.inputPlaceholder}
                  secureTextEntry
                />
                <FormField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  inputStyle={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder }}
                  labelStyle={{ color: theme.labelText }}
                  inputTextColor={theme.inputText}
                  inputPlaceholderColor={theme.inputPlaceholder}
                  secureTextEntry
                />

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: theme.modalCancelBg }]}
                    onPress={closePasswordModal}
                    disabled={isSubmitting}
                  >
                    <Text style={[styles.modalButtonText, styles.modalCancelText, { color: theme.modalCancelText }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.updateButton, isSubmitting && styles.disabledButton]}
                    onPress={handleChangePassword}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.modalButtonText}>{isSubmitting ? 'Updating...' : 'Update'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 14,
  },
  actionsWrap: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  avatarImage: {
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  disabledButton: {
    opacity: 0.65,
  },
  heroCard: {
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    paddingBottom: 20,
    paddingHorizontal: 12,
    paddingTop: 20,
    width: '100%',
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarEditButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 0,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 24,
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  heroAccent: {
    backgroundColor: '#14b8a6',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    bottom: -10,
    height: 16,
    left: -16,
    position: 'absolute',
    right: -16,
  },
  heroName: {
    color: '#334155',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroRole: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoSection: {
    marginBottom: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  themeToggleHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeToggleRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingTop: 12,
  },
  themeToggleTextWrap: {
    flexShrink: 1,
    paddingRight: 12,
  },
  infoRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingTop: 12,
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
  profileCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    marginBottom: 12,
    overflow: 'hidden',
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 14,
  },
  modalKeyboardContainer: {
    flex: 1,
  },
  modalButton: {
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e2e8f0',
  },
  modalCancelText: {
    color: '#1e293b',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#b91c1c',
  },
  updateButton: {
    backgroundColor: '#0f766e',
  },
})

export default DentistProfileScreen
