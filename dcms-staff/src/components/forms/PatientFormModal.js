import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import FormField from '../FormField'

const initialForm = {
  fullName: '',
  age: '',
  gender: '',
  contact: '',
  address: '',
}

const genderOptions = ['Male', 'Female', 'Other']

const PatientFormModal = ({ visible, patient, isSubmitting, onSubmit, onClose }) => {
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
    return (
      form.fullName.trim().length > 1 &&
      Number(form.age) > 0 &&
      form.gender.trim().length > 0 &&
      form.contact.trim().length > 4 &&
      form.address.trim().length > 4
    )
  }, [form])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!isValid || isSubmitting) {
      return
    }

    onSubmit(form)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.header}>{patient ? 'Update Patient' : 'Create Patient'}</Text>

        <ScrollView contentContainerStyle={styles.content}>
          <FormField
            label="Full Name"
            value={form.fullName}
            onChangeText={(text) => updateField('fullName', text)}
            placeholder="Juan Dela Cruz"
          />
          <FormField
            label="Age"
            value={form.age}
            onChangeText={(text) => updateField('age', text.replace(/[^0-9]/g, ''))}
            placeholder="30"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => {
              const isActive = form.gender.toLowerCase() === option.toLowerCase()
              return (
                <Pressable
                  key={option}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => updateField('gender', option)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option}</Text>
                </Pressable>
              )
            })}
          </View>

          <FormField
            label="Contact"
            value={form.contact}
            onChangeText={(text) => updateField('contact', text)}
            placeholder="09xxxxxxxxx"
            keyboardType="phone-pad"
          />
          <FormField
            label="Address"
            value={form.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="City, Province"
            multiline
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
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
    backgroundColor: '#e2e8f0',
  },
  cancelText: {
    color: '#1e293b',
  },
  chip: {
    borderColor: '#cbd5e1',
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
    backgroundColor: '#f8fafc',
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
    borderTopColor: '#e2e8f0',
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
