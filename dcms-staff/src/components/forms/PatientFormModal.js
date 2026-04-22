import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import FormField from '../FormField'
import { useTheme } from '../../hooks/useTheme'

const initialForm = {
  fullName: '',
  age: '',
  gender: '',
  contact: '',
  address: '',
}

const genderOptions = ['Male', 'Female', 'Other']
const namePattern = /^[A-Za-z][A-Za-z .'-]*$/
const contactPattern = /^09\d{9}$/

const sanitizeName = (value) => String(value || '').replace(/[^A-Za-z .'-]/g, '')
const sanitizeDigits = (value) => String(value || '').replace(/[^0-9]/g, '')

const PatientFormModal = ({ visible, patient, isSubmitting, onSubmit, onClose }) => {
  const { colors } = useTheme()
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!visible) {
      return
    }

    if (patient) {
      setForm({
        fullName: patient.fullName || '',
        age: String(patient.age || ''),
        gender: patient.gender || '',
        contact: patient.contact || '',
        address: patient.address || '',
      })
      return
    }

    setForm(initialForm)
  }, [patient, visible])

  const isValid = useMemo(() => {
    const ageNumber = Number(form.age)

    return (
      namePattern.test(form.fullName.trim()) &&
      Number.isInteger(ageNumber) &&
      ageNumber >= 1 &&
      ageNumber <= 120 &&
      form.gender.trim().length > 0 &&
      contactPattern.test(form.contact.trim()) &&
      form.address.trim().length > 4
    )
  }, [form])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!isValid || isSubmitting) {
      if (!namePattern.test(form.fullName.trim())) {
        Alert.alert('Invalid full name', 'Please enter letters only for the patient name.')
      } else if (!Number.isInteger(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120) {
        Alert.alert('Invalid age', 'Please enter an age between 1 and 120.')
      } else if (!form.gender.trim()) {
        Alert.alert('Missing gender', 'Please select a gender.')
      } else if (!contactPattern.test(form.contact.trim())) {
        Alert.alert('Invalid contact', 'Please enter an 11-digit mobile number starting with 09.')
      } else if (form.address.trim().length <= 4) {
        Alert.alert('Invalid address', 'Please enter a complete address.')
      }
      return
    }

    onSubmit(form)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Text style={[styles.header, { color: colors.strongText }]}>{patient ? 'Update Patient' : 'Create Patient'}</Text>

        <ScrollView contentContainerStyle={styles.content}>
          <FormField
            label="Full Name"
            value={form.fullName}
            onChangeText={(text) => updateField('fullName', sanitizeName(text))}
            placeholder="Juan Dela Cruz"
            autoCapitalize="words"
            maxLength={80}
          />
          <FormField
            label="Age"
            value={form.age}
            onChangeText={(text) => updateField('age', sanitizeDigits(text).slice(0, 3))}
            placeholder="30"
            keyboardType="number-pad"
            maxLength={3}
          />

          <Text style={[styles.label, { color: colors.labelText }]}>Gender</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => {
              const isActive = form.gender.toLowerCase() === option.toLowerCase()
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    { borderColor: colors.inputBorder, backgroundColor: colors.panelBg },
                    isActive && styles.chipActive,
                  ]}
                  onPress={() => updateField('gender', option)}
                >
                  <Text style={[styles.chipText, { color: colors.labelText }, isActive && styles.chipTextActive]}>{option}</Text>
                </Pressable>
              )
            })}
          </View>

          <FormField
            label="Contact"
            value={form.contact}
            onChangeText={(text) => updateField('contact', sanitizeDigits(text).slice(0, 11))}
            placeholder="09xxxxxxxxx"
            keyboardType="phone-pad"
            maxLength={11}
          />
          <FormField
            label="Address"
            value={form.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="City, Province"
            multiline
            maxLength={160}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.screenBg }]}>
          <Pressable
            style={[styles.button, styles.cancelButton, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, styles.cancelText, { color: colors.labelText }]}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.saveButton, (!isValid || isSubmitting) && styles.disabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelText: {
    color: '#1e293b',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    paddingTop: 58,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  disabled: {
    opacity: 0.6,
  },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  header: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  saveButton: {
    backgroundColor: '#0f766e',
  },
})

export default PatientFormModal
