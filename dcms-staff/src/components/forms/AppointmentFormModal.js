import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import FormField from '../FormField'

const initialForm = {
  patientId: '',
  date: '',
  time: '',
  status: 'pending',
  dentist: '',
  notes: '',
}

const AppointmentFormModal = ({
  visible,
  appointment,
  patients,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!visible) {
      return
    }

    if (appointment) {
      setForm({
        patientId: appointment.patientId || '',
        date: appointment.date || '',
        time: appointment.time || '',
        status: appointment.status || 'pending',
        dentist: appointment.dentist || '',
        notes: appointment.notes || '',
      })
      return
    }

    setForm(initialForm)
  }, [appointment, visible])

  const isValid = useMemo(() => {
    return (
      form.patientId &&
      form.date.trim().length > 0 &&
      form.time.trim().length > 0
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
        <Text style={styles.header}>{appointment ? 'Update Appointment' : 'Create Appointment'}</Text>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Patient</Text>
          <View style={styles.patientList}>
            {patients.map((patient) => {
              const isSelected = form.patientId === patient.id
              return (
                <Pressable
                  key={patient.id}
                  style={[styles.patientChip, isSelected && styles.patientChipActive]}
                  onPress={() => updateField('patientId', patient.id)}
                >
                  <Text style={[styles.patientText, isSelected && styles.patientTextActive]}>
                    {patient.fullName}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <FormField
            label="Date (YYYY-MM-DD)"
            value={form.date}
            onChangeText={(text) => updateField('date', text)}
            placeholder="2026-03-21"
          />
          <FormField
            label="Time (HH:MM)"
            value={form.time}
            onChangeText={(text) => updateField('time', text)}
            placeholder="09:30"
          />

          <FormField
            label="Dentist (Optional)"
            value={form.dentist}
            onChangeText={(text) => updateField('dentist', text)}
            placeholder="Dr. Santos"
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Treatment details"
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
  patientChip: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  patientChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  patientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  patientText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  patientTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#0f766e',
  },
})

export default AppointmentFormModal
