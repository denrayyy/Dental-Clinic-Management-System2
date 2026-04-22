import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  LEGAL_LAST_UPDATED,
  PRIVACY_POLICY,
  TERMS_AND_CONDITIONS,
} from '../content/legalDocuments'
import { useAuth } from '../hooks/useAuth'

const TermsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { acceptTermsAndContinue, isAcceptingTerms, logout } = useAuth()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  const docType = route.params?.docType === 'privacy' ? 'privacy' : 'terms'
  const requireAcceptance = Boolean(route.params?.requireAcceptance)

  const document = useMemo(() => {
    if (docType === 'privacy') {
      return {
        title: 'Privacy Policy',
        intro:
          'This policy explains how the Dental Clinic Management System handles user and patient data for authorized staff and dentist users.',
        sections: PRIVACY_POLICY,
      }
    }

    return {
      title: 'Terms and Conditions',
      intro:
        'Welcome to the Dental Clinic Management System. By accessing and using this application, you agree to the following terms and conditions.',
      sections: TERMS_AND_CONDITIONS,
    }
  }, [docType])

  const canAccept = requireAcceptance && hasScrolledToBottom && isChecked && !isAcceptingTerms

  const onScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 24
    if (nearBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = async () => {
    if (!canAccept) {
      return
    }

    try {
      await acceptTermsAndContinue()
    } catch {
      Alert.alert('Unable to continue', 'Failed to save your acceptance. Please try again.')
    }
  }

  const handleClose = () => {
    if (!requireAcceptance) {
      navigation.goBack()
      return
    }

    Alert.alert(
      'Decline Terms',
      'You must accept the Terms and Conditions to use this app. Exit now?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>{document.title}</Text>
        <Pressable style={styles.backButton} onPress={handleClose}>
          <Ionicons name="close" size={18} color="#0f172a" />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.lastUpdated}>Last Updated: {LEGAL_LAST_UPDATED}</Text>
        <Text style={styles.intro}>{document.intro}</Text>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {document.sections.map((section) => (
            <View key={section.heading} style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <Text style={styles.acknowledgement}>
            By continuing to use this system, you acknowledge that you have read and agreed to these terms.
          </Text>
        </ScrollView>
      </View>

      {requireAcceptance ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Pressable style={styles.checkboxRow} onPress={() => setIsChecked((prev) => !prev)}>
            <Ionicons
              name={isChecked ? 'checkbox-outline' : 'square-outline'}
              size={20}
              color="#0f766e"
            />
            <Text style={styles.checkboxText}>I have read and agree to the Terms and Conditions</Text>
          </Pressable>

          <Pressable
            style={[styles.acceptButton, !canAccept && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!canAccept}
          >
            {isAcceptingTerms ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept and Continue</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  acknowledgement: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  acceptButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    margin: 14,
    padding: 14,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  checkboxText: {
    color: '#0f172a',
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  intro: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  lastUpdated: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  scrollArea: {
    marginTop: 10,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionBody: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionHeading: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
})

export default TermsScreen
