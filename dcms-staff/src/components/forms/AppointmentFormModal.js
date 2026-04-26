import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useTheme } from '../../hooks/useTheme'

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

const appointmentTimeOptions = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
]

const AppointmentFormModal = ({
  visible,
  appointment,
  patients,
  dentists = [],
  services = [],
  holidayDates = [],
  isHolidayLoading = false,
  holidayError = '',
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  const { colors } = useTheme()
  const [form, setForm] = useState(initialForm)
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [isDentistDropdownOpen, setIsDentistDropdownOpen] = useState(false)
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [holidayNotice, setHolidayNotice] = useState('')

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
      setIsTimeDropdownOpen(false)
      setHolidayNotice('')
      return
    }

    setForm(initialForm)
    setPatientSearch('')
    setIsPatientDropdownOpen(false)
    setIsDentistDropdownOpen(false)
    setIsTimeDropdownOpen(false)
    setHolidayNotice('')
  }, [appointment, visible])

  const holidayDateSet = useMemo(() => new Set(holidayDates), [holidayDates])

  const calendarMarkedDates = useMemo(() => {
    const marks = {}

    // Public holidays are shown with a red dot so staff can avoid closed dates.
    holidayDates.forEach((dateString) => {
      marks[dateString] = {
        marked: true,
        dotColor: '#b91c1c',
      }
    })

    if (form.date) {
      marks[form.date] = {
        ...(marks[form.date] || {}),
        selected: true,
        selectedColor: '#0f766e',
      }
    }

    return marks
  }, [form.date, holidayDates])

  const selectedServiceIds = useMemo(
    () => new Set(form.services.map((service) => service.serviceId)),
    [form.services],
  )

  const isValid = useMemo(() => {
    return (
      form.patientId &&
      form.date &&
      form.time &&
      !holidayDateSet.has(form.date) &&
      form.dentistId.trim().length > 0 &&
      form.services.length > 0
    )
  }, [form, holidayDateSet])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!isValid || isSubmitting) {
      if (!form.patientId) {
        Alert.alert('Missing patient', 'Please select a patient.')
      } else if (!form.date) {
        Alert.alert('Missing date', 'Please select a date from the calendar.')
      } else if (holidayDateSet.has(form.date)) {
        Alert.alert('Clinic is closed on this date', 'Please choose a different date.')
      } else if (!form.time) {
        Alert.alert('Missing time', 'Please select an appointment time.')
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

  const handleCalendarDatePress = (day) => {
    const selectedDate = day?.dateString
    if (!selectedDate) {
      return
    }

    // Block holiday bookings and explain why the date cannot be used.
    if (holidayDateSet.has(selectedDate)) {
      setHolidayNotice('Clinic is closed on this date')
      updateField('date', '')
      Alert.alert('Clinic is closed on this date', 'Please select a different date.')
      return
    }

    setHolidayNotice('')
    updateField('date', selectedDate)
  }

  const selectTime = (timeValue) => {
    updateField('time', timeValue)
    setIsTimeDropdownOpen(false)
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
      <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
        <Text style={[styles.header, { color: colors.strongText }]}>{appointment ? 'Update Appointment' : 'Create Appointment'}</Text>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.label, { color: colors.labelText }]}>Patient</Text>
          <Pressable
            style={[styles.dropdownTrigger, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setIsPatientDropdownOpen((prev) => !prev)}
            disabled={!patients.length}
          >
            <Text style={[selectedPatient ? styles.dropdownValue : styles.dropdownPlaceholder, { color: selectedPatient ? colors.inputText : colors.inputPlaceholder }]}>
              {selectedPatient
                ? selectedPatient.fullName
                : patients.length
                  ? 'Select patient'
                  : 'No patients available'}
            </Text>
            <Text style={[styles.dropdownChevron, { color: colors.mutedText }]}>{isPatientDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isPatientDropdownOpen && patients.length ? (
            <View style={[styles.dropdownMenuCompact, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
              <TextInput
                value={patientSearch}
                onChangeText={setPatientSearch}
                placeholder="Search patient name"
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.searchInput, { backgroundColor: colors.inputBg, borderBottomColor: colors.line, color: colors.inputText }]}
              />

              <ScrollView nestedScrollEnabled style={styles.patientResults}>
                {visiblePatients.map((patient) => {
                  const isSelected = form.patientId === patient.id

                  return (
                    <Pressable
                      key={patient.id}
                      style={[
                        styles.dropdownOption,
                        { borderBottomColor: colors.line },
                        isSelected && styles.patientChipActive,
                      ]}
                      onPress={() => selectPatient(patient)}
                    >
                      <Text style={[styles.dropdownOptionText, { color: colors.labelText }, isSelected && styles.patientTextActive]}>
                        {patient.fullName}
                      </Text>
                    </Pressable>
                  )
                })}

                {!visiblePatients.length ? (
                  <Text style={[styles.emptyDropdownText, { color: colors.mutedText }]}>No patients found.</Text>
                ) : null}
              </ScrollView>

              {!patientSearch.trim() && hiddenPatientCount > 0 ? (
                <Text style={[styles.helperText, { color: colors.mutedText }]}>Type in search to view {hiddenPatientCount} more patients.</Text>
              ) : null}
            </View>
          ) : null}

          {!patients.length ? <Text style={[styles.helperText, { color: colors.mutedText }]}>No patients found.</Text> : null}

          <Text style={[styles.label, { color: colors.labelText }]}>Appointment Date</Text>
          <View style={[styles.calendarWrap, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
            <Calendar
              current={form.date || undefined}
              onDayPress={handleCalendarDatePress}
              markedDates={calendarMarkedDates}
              theme={{
                calendarBackground: colors.panelBg,
                dayTextColor: colors.inputText,
                monthTextColor: colors.strongText,
                selectedDayBackgroundColor: '#0f766e',
                selectedDayTextColor: '#ffffff',
                textDisabledColor: colors.mutedText,
                todayTextColor: '#0f766e',
                arrowColor: '#0f766e',
              }}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.mutedText }]}>Red dots are Philippine public holidays from Calendarific.</Text>
          {isHolidayLoading ? (
            <Text style={[styles.helperText, { color: colors.mutedText }]}>Loading holiday calendar...</Text>
          ) : null}
          {holidayError ? (
            <Text style={[styles.errorText, { color: '#b91c1c' }]}>{holidayError}</Text>
          ) : null}
          {holidayNotice ? (
            <Text style={[styles.errorText, { color: '#b91c1c' }]}>{holidayNotice}</Text>
          ) : null}
          {form.date ? (
            <Text style={[styles.selectedDateText, { color: colors.strongText }]}>Selected date: {form.date}</Text>
          ) : null}

          <Text style={[styles.label, { color: colors.labelText }]}>Appointment Time</Text>
          <Pressable
            style={[styles.dropdownTrigger, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setIsTimeDropdownOpen((prev) => !prev)}
          >
            <Text style={[form.time ? styles.dropdownValue : styles.dropdownPlaceholder, { color: form.time ? colors.inputText : colors.inputPlaceholder }]}>
              {form.time || 'Select time'}
            </Text>
            <Text style={[styles.dropdownChevron, { color: colors.mutedText }]}>{isTimeDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isTimeDropdownOpen ? (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
              <ScrollView nestedScrollEnabled style={styles.timeListScroll}>
                {appointmentTimeOptions.map((timeValue) => {
                  const isSelected = form.time === timeValue
                  return (
                    <Pressable
                      key={timeValue}
                      style={[
                        styles.dropdownOption,
                        { borderBottomColor: colors.line },
                        isSelected && styles.patientChipActive,
                      ]}
                      onPress={() => selectTime(timeValue)}
                    >
                      <Text style={[styles.dropdownOptionText, { color: colors.labelText }, isSelected && styles.patientTextActive]}>
                        {timeValue}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.labelText }]}>Assign Dentist</Text>
          <Pressable
            style={[styles.dropdownTrigger, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setIsDentistDropdownOpen((prev) => !prev)}
            disabled={!dentists.length}
          >
            <Text style={[selectedDentist ? styles.dropdownValue : styles.dropdownPlaceholder, { color: selectedDentist ? colors.inputText : colors.inputPlaceholder }]}>
              {selectedDentist
                ? formatDentistName(selectedDentist.name)
                : dentists.length
                  ? 'Select dentist'
                  : 'No active dentists available'}
            </Text>
            <Text style={[styles.dropdownChevron, { color: colors.mutedText }]}>{isDentistDropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {isDentistDropdownOpen && dentists.length ? (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
              {dentists.map((dentist) => {
                const isSelected = form.dentistId === dentist.id

                return (
                  <Pressable
                    key={dentist.id}
                    style={[
                      styles.dropdownOption,
                      { borderBottomColor: colors.line },
                      isSelected && styles.patientChipActive,
                    ]}
                    onPress={() => selectDentist(dentist)}
                  >
                    <Text style={[styles.dropdownOptionText, { color: colors.labelText }, isSelected && styles.patientTextActive]}>
                      {formatDentistName(dentist.name)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          {!dentists.length ? (
            <Text style={[styles.helperText, { color: colors.mutedText }]}>No active dentists found.</Text>
          ) : null}

          <Text style={[styles.label, { color: colors.labelText }]}>Services</Text>
          {services.length ? (
            <View style={[styles.serviceListBox, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
              <ScrollView nestedScrollEnabled style={styles.serviceListScroll}>
                {services.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id)

                  return (
                    <Pressable
                      key={service.id}
                      style={[
                        styles.serviceRow,
                        { borderBottomColor: colors.line },
                        isSelected && styles.patientChipActive,
                      ]}
                      onPress={() => toggleService(service)}
                    >
                      <View style={styles.checkboxWrap}>
                        <View style={[styles.checkbox, { borderColor: colors.inputBorder }, isSelected && styles.checkboxSelected]}>
                          <Text style={[styles.checkboxText, { color: isSelected ? '#0f766e' : 'transparent' }]}>{isSelected ? '✓' : ''}</Text>
                        </View>
                        <Text style={[styles.serviceText, { color: colors.labelText }, isSelected && styles.patientTextActive]}>
                          {service.name}
                        </Text>
                      </View>
                      <Text style={[styles.servicePrice, { color: colors.inputText }, isSelected && styles.patientTextActive]}>
                        {formatPeso(service.price)}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}

          {!services.length ? (
            <Text style={[styles.helperText, { color: colors.mutedText }]}>No services found.</Text>
          ) : null}

          {form.services.length ? (
            <View style={[styles.selectedListBox, { backgroundColor: colors.panelBg, borderColor: colors.inputBorder }]}>
              <Text style={[styles.selectedTitle, { color: colors.strongText }]}>Selected Services</Text>
              {form.services.map((service) => (
                <View key={service.serviceId} style={styles.selectedRow}>
                  <Text style={[styles.selectedName, { color: colors.labelText }]}>• {service.name}</Text>
                  <Text style={[styles.selectedPrice, { color: colors.inputText }]}>{formatPeso(service.price)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={[styles.priceBox, { backgroundColor: colors.sectionBg, borderColor: colors.line }]}>
            <Text style={[styles.priceLabel, { color: colors.brandPrimary }]}>Total</Text>
            <Text style={[styles.priceValue, { color: colors.strongText }]}>{formatPeso(form.totalPrice)}</Text>
          </View>
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
    borderWidth: 1,
  },
  cancelText: {
    color: '#1e293b',
  },
  container: {
    flex: 1,
    paddingTop: 58,
  },
  calendarWrap: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
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
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownOption: {
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
  errorText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderBottomWidth: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownMenuCompact: {
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
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  selectedDateText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: -2,
  },
  serviceListScroll: {
    maxHeight: 170,
  },
  timeListScroll: {
    maxHeight: 180,
  },
  servicePrice: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
  serviceRow: {
    alignItems: 'center',
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
