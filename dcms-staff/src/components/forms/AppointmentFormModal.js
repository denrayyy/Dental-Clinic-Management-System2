import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import FormField from '../FormField'

const initialForm = {
  patientId: '',
  date: '',
  time: '',
  status: 'pending',
  dentistId: '',
  dentistName: '',
  services: [],
  totalPrice: 0,
}

const normalizeServiceEntry = (service) => {
  const serviceId = String(service?.serviceId || service?.id || '').trim()
  const name = String(service?.name || service?.serviceName || '').trim()
  const price = Number(service?.price) || 0

  if (!serviceId || !name) {
    return null
  }

  return {
    serviceId,
    name,
    price,
  }
}

const sumServiceTotal = (selectedServices) => {
  return selectedServices.reduce((sum, service) => sum + (Number(service.price) || 0), 0)
}

const resolveSelectedServices = (appointment) => {
  const selected = Array.isArray(appointment?.services)
    ? appointment.services.map(normalizeServiceEntry).filter(Boolean)
    : []

  if (selected.length) {
    return selected
  }

  const fallback = normalizeServiceEntry({
    serviceId: appointment?.serviceId,
    name: appointment?.serviceName,
    price: appointment?.price ?? appointment?.fee,
  })

  return fallback ? [fallback] : []
}

const formatDateInput = (value) => {
  const digits = String(value || '').replace(/[^0-9]/g, '').slice(0, 8)
  if (digits.length <= 4) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

const formatTimeInput = (value) => {
  const digits = String(value || '').replace(/[^0-9]/g, '').slice(0, 4)
  if (digits.length <= 2) {
    return digits
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

const isValidDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const isValidTime = (value) => {
  const match = String(value || '').match(/^(\d{2}):(\d{2})$/)
  if (!match) {
    return false
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

const AppointmentFormModal = ({
  visible,
  appointment,
  patients,
  dentists = [],
  services = [],
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(initialForm)
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [isDentistDropdownOpen, setIsDentistDropdownOpen] = useState(false)

  const formatPeso = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  const formatDentistName = (name) => {
    const trimmedName = String(name || '').trim()
    if (!trimmedName) {
      return 'Dr. Dentist'
    }

    const normalized = trimmedName.toLowerCase()
    if (normalized.startsWith('dr.') || normalized.startsWith('dr ')) {
      return trimmedName
    }

    return `Dr. ${trimmedName}`
  }

  useEffect(() => {
    if (!visible) {
      return
    }

    if (appointment) {
      const selectedServices = resolveSelectedServices(appointment)
      const resolvedTotal = Number(appointment.totalPrice)

      setForm({
        patientId: appointment.patientId || '',
        date: appointment.date || '',
        time: appointment.time || '',
        status: appointment.status || 'pending',
        dentistId: appointment.dentistId || '',
        dentistName: appointment.dentistName || appointment.dentist || '',
        services: selectedServices,
        totalPrice:
          Number.isFinite(resolvedTotal) && resolvedTotal >= 0
            ? resolvedTotal
            : sumServiceTotal(selectedServices),
      })
      setPatientSearch('')
      setIsPatientDropdownOpen(false)
      setIsDentistDropdownOpen(false)
      return
    }

    setForm(initialForm)
    setPatientSearch('')
    setIsPatientDropdownOpen(false)
    setIsDentistDropdownOpen(false)
  }, [appointment, visible])

  const selectedServiceIds = useMemo(
    () => new Set(form.services.map((service) => service.serviceId)),
    [form.services],
  )

  const isValid = useMemo(() => {
    return (
      form.patientId &&
      isValidDate(form.date) &&
      isValidTime(form.time) &&
      form.dentistId.trim().length > 0 &&
      form.services.length > 0
    )
  }, [form])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!isValid || isSubmitting) {
      if (!form.patientId) {
        Alert.alert('Missing patient', 'Please select a patient.')
      } else if (!isValidDate(form.date)) {
        Alert.alert('Invalid date', 'Please enter date in YYYY-MM-DD format.')
      } else if (!isValidTime(form.time)) {
        Alert.alert('Invalid time', 'Please enter time in HH:MM (24-hour) format.')
      } else if (!form.dentistId.trim()) {
        Alert.alert('Missing dentist', 'Please assign a dentist before saving.')
      } else if (!form.services.length) {
        Alert.alert('Missing service', 'Please select at least one service before saving.')
      }
      return
    }

    Alert.alert(
      appointment ? 'Update appointment' : 'Create appointment',
      appointment
        ? 'Save these updated appointment details?'
        : 'Create this appointment with the selected services?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => onSubmit(form),
        },
      ],
    )
  }

  const selectDentist = (dentist) => {
    updateField('dentistId', dentist.id)
    updateField('dentistName', dentist.name || '')
    setIsDentistDropdownOpen(false)
  }

  const selectPatient = (patient) => {
    updateField('patientId', patient.id)
    setIsPatientDropdownOpen(false)
    setPatientSearch('')
  }

  const toggleService = (service) => {
    const normalizedService = normalizeServiceEntry(service)
    if (!normalizedService) {
      return
    }

    setForm((current) => {
      const exists = current.services.some(
        (selected) => selected.serviceId === normalizedService.serviceId,
      )

      const nextServices = exists
        ? current.services.filter((selected) => selected.serviceId !== normalizedService.serviceId)
        : [...current.services, normalizedService]

      return {
        ...current,
        services: nextServices,
        totalPrice: sumServiceTotal(nextServices),
      }
    })
  }

  const selectedPatient = patients.find((patient) => patient.id === form.patientId)
  const selectedDentist = dentists.find((dentist) => dentist.id === form.dentistId)

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')))
  }, [patients])

  const filteredPatients = useMemo(() => {
    const keyword = patientSearch.trim().toLowerCase()
    if (!keyword) {
      return sortedPatients
    }

    return sortedPatients.filter((patient) =>
      String(patient.fullName || '').toLowerCase().includes(keyword),
    )
  }, [patientSearch, sortedPatients])

  const patientLimit = 20
  const visiblePatients = patientSearch.trim() ? filteredPatients : filteredPatients.slice(0, patientLimit)
  const hiddenPatientCount = Math.max(filteredPatients.length - visiblePatients.length, 0)

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.header}>{appointment ? 'Update Appointment' : 'Create Appointment'}</Text>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Patient</Text>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => setIsPatientDropdownOpen((prev) => !prev)}
            disabled={!patients.length}
          >
            <Text style={selectedPatient ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {selectedPatient
                ? selectedPatient.fullName
                : patients.length
                  ? 'Select patient'
                  : 'No patients available'}
            </Text>
            <Text style={styles.dropdownChevron}>{isPatientDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isPatientDropdownOpen && patients.length ? (
            <View style={styles.dropdownMenuCompact}>
              <TextInput
                value={patientSearch}
                onChangeText={setPatientSearch}
                placeholder="Search patient name"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />

              <ScrollView nestedScrollEnabled style={styles.patientResults}>
                {visiblePatients.map((patient) => {
                  const isSelected = form.patientId === patient.id

                  return (
                    <Pressable
                      key={patient.id}
                      style={[styles.dropdownOption, isSelected && styles.patientChipActive]}
                      onPress={() => selectPatient(patient)}
                    >
                      <Text style={[styles.dropdownOptionText, isSelected && styles.patientTextActive]}>
                        {patient.fullName}
                      </Text>
                    </Pressable>
                  )
                })}

                {!visiblePatients.length ? (
                  <Text style={styles.emptyDropdownText}>No patients found.</Text>
                ) : null}
              </ScrollView>

              {!patientSearch.trim() && hiddenPatientCount > 0 ? (
                <Text style={styles.helperText}>Type in search to view {hiddenPatientCount} more patients.</Text>
              ) : null}
            </View>
          ) : null}

          {!patients.length ? <Text style={styles.helperText}>No patients found.</Text> : null}

          <FormField
            label="Date (YYYY-MM-DD)"
            value={form.date}
            onChangeText={(text) => updateField('date', formatDateInput(text))}
            placeholder="2026-03-21"
            keyboardType="number-pad"
            maxLength={10}
          />
          <FormField
            label="Time (HH:MM)"
            value={form.time}
            onChangeText={(text) => updateField('time', formatTimeInput(text))}
            placeholder="09:30"
            keyboardType="number-pad"
            maxLength={5}
          />

          <Text style={styles.label}>Assign Dentist</Text>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => setIsDentistDropdownOpen((prev) => !prev)}
            disabled={!dentists.length}
          >
            <Text style={selectedDentist ? styles.dropdownValue : styles.dropdownPlaceholder}>
              {selectedDentist
                ? formatDentistName(selectedDentist.name)
                : dentists.length
                  ? 'Select dentist'
                  : 'No active dentists available'}
            </Text>
            <Text style={styles.dropdownChevron}>{isDentistDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isDentistDropdownOpen && dentists.length ? (
            <View style={styles.dropdownMenu}>
              {dentists.map((dentist) => {
                const isSelected = form.dentistId === dentist.id

                return (
                  <Pressable
                    key={dentist.id}
                    style={[styles.dropdownOption, isSelected && styles.patientChipActive]}
                    onPress={() => selectDentist(dentist)}
                  >
                    <Text style={[styles.dropdownOptionText, isSelected && styles.patientTextActive]}>
                      {formatDentistName(dentist.name)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          {!dentists.length ? (
            <Text style={styles.helperText}>No active dentists found.</Text>
          ) : null}

          <Text style={styles.label}>Services</Text>
          {services.length ? (
            <View style={styles.serviceListBox}>
              <ScrollView nestedScrollEnabled style={styles.serviceListScroll}>
                {services.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id)

                  return (
                    <Pressable
                      key={service.id}
                      style={[styles.serviceRow, isSelected && styles.patientChipActive]}
                      onPress={() => toggleService(service)}
                    >
                      <View style={styles.checkboxWrap}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          <Text style={styles.checkboxText}>{isSelected ? '✓' : ''}</Text>
                        </View>
                        <Text style={[styles.serviceText, isSelected && styles.patientTextActive]}>
                          {service.name}
                        </Text>
                      </View>
                      <Text style={[styles.servicePrice, isSelected && styles.patientTextActive]}>
                        {formatPeso(service.price)}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}

          {!services.length ? (
            <Text style={styles.helperText}>No services found.</Text>
          ) : null}

          {form.services.length ? (
            <View style={styles.selectedListBox}>
              <Text style={styles.selectedTitle}>Selected Services</Text>
              {form.services.map((service) => (
                <View key={service.serviceId} style={styles.selectedRow}>
                  <Text style={styles.selectedName}>• {service.name}</Text>
                  <Text style={styles.selectedPrice}>{formatPeso(service.price)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>{formatPeso(form.totalPrice)}</Text>
          </View>
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
  checkbox: {
    alignItems: 'center',
    borderColor: '#94a3b8',
    borderRadius: 4,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    marginRight: 10,
    width: 18,
  },
  checkboxSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  checkboxText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  checkboxWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
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
  dropdownChevron: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownOption: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownPlaceholder: {
    color: '#94a3b8',
    fontSize: 14,
  },
  dropdownTrigger: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
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
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -4,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  patientChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  patientTextActive: {
    color: '#fff',
  },
  patientResults: {
    maxHeight: 170,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    color: '#0f172a',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownMenuCompact: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  emptyDropdownText: {
    color: '#64748b',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#0f766e',
  },
  selectedListBox: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  selectedName: {
    color: '#1e293b',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedPrice: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 12,
  },
  selectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  selectedTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  serviceListBox: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  serviceListScroll: {
    maxHeight: 170,
  },
  servicePrice: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
  serviceRow: {
    alignItems: 'center',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  priceBox: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceLabel: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
})

export default AppointmentFormModal
