import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import FormField from '../components/FormField'
import LoadingOverlay from '../components/LoadingOverlay'
import AppointmentFormModal from '../components/forms/AppointmentFormModal'
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from '../services/appointmentService'
import { fetchServices } from '../services/serviceService'
import { getPatients } from '../services/patientService'
import { getActiveDentists } from '../services/staffDirectoryService'
import { useAuth } from '../hooks/useAuth'
import { addAuditLog } from '../services/logService'
import { useTheme } from '../hooks/useTheme'
import { fetchPhilippineHolidays } from '../services/calendarificService'

const statusOptions = ['all', 'pending', 'completed', 'cancelled']

const getAppointmentServiceList = (appointment) => {
  if (Array.isArray(appointment?.services) && appointment.services.length) {
    return appointment.services
      .map((service) => `${service.name} (${new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
      }).format(Number(service.price) || 0)})`)
      .join(', ')
  }

  if (appointment?.serviceName) {
    return appointment.serviceName
  }

  return 'Not selected'
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

const AppointmentsScreen = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { colors } = useTheme()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [dentists, setDentists] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [completingAppointment, setCompletingAppointment] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [holidayDates, setHolidayDates] = useState([])
  const [isHolidayLoading, setIsHolidayLoading] = useState(true)
  const [holidayError, setHolidayError] = useState('')

  const formatPeso = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  const patientLookup = useMemo(() => {
    const map = new Map()
    patients.forEach((patient) => {
      map.set(patient.id, patient.fullName)
    })
    return map
  }, [patients])

  const loadData = useCallback(async () => {
    setError('')
    setHolidayError('')
    setIsHolidayLoading(true)

    try {
      const [appointmentsResult, patientsResult, dentistsResult, servicesResult, holidaysResult] = await Promise.allSettled([
        getAppointments(),
        getPatients(),
        getActiveDentists(),
        fetchServices(),
        fetchPhilippineHolidays({ year: 2026 }),
      ])

      const appointmentsData = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : []
      const patientsData = patientsResult.status === 'fulfilled' ? patientsResult.value : []
      const dentistsData = dentistsResult.status === 'fulfilled' ? dentistsResult.value : []
      const servicesData = servicesResult.status === 'fulfilled' ? servicesResult.value : []
      const holidaysData = holidaysResult.status === 'fulfilled' ? holidaysResult.value : []

      setAppointments(appointmentsData)
      setPatients(patientsData)
      setDentists(dentistsData)
      setServices(servicesData)
      setHolidayDates(holidaysData)

      if (holidaysResult.status === 'rejected') {
        setHolidayError('Unable to load holiday calendar. Please check Calendarific API key.')
      }

      if (
        appointmentsResult.status === 'rejected' ||
        patientsResult.status === 'rejected' ||
        dentistsResult.status === 'rejected' ||
        servicesResult.status === 'rejected'
      ) {
        setError('Unable to load appointments. Pull to refresh and try again.')
      }
    } catch {
      setError('Unable to load appointments. Pull to refresh and try again.')
      setHolidayError('Unable to load holiday calendar. Please check Calendarific API key.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
      setIsHolidayLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const normalizedStatus =
          appointment.status === 'cancel' ? 'cancelled' : appointment.status
        const statusMatch = filterStatus === 'all' || normalizedStatus === filterStatus
        const dateMatch = !filterDate || appointment.date === filterDate
        return statusMatch && dateMatch
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [appointments, filterDate, filterStatus])

  const handleSave = async (form) => {
    setIsSubmitting(true)
    const patientName = String(patientLookup.get(form.patientId) || '').trim()

    try {
      if (!form.dentistId) {
        Alert.alert('Missing dentist', 'Please assign a dentist before saving.')
        return
      }

      if (!Array.isArray(form.services) || !form.services.length) {
        Alert.alert('Missing service', 'Please select at least one service before saving.')
        return
      }

      if (editingAppointment?.id) {
        const editingStatus =
          editingAppointment.status === 'cancel' ? 'cancelled' : editingAppointment.status

        if (editingStatus === 'completed') {
          Alert.alert('Editing locked', 'Completed appointments can no longer be edited.')
          return
        }

        await updateAppointment(editingAppointment.id, {
          ...form,
          patientName,
          status: editingAppointment.status || 'pending',
          totalPrice: Number(form.totalPrice) || 0,
        })
        await addAuditLog(
          user?.uid || 'staff',
          'update',
          'appointments',
          `${editingAppointment.id} - ${form.date} ${form.time}`,
        )
      } else {
        const createdId = await createAppointment({
          ...form,
          patientName,
          createdBy: user?.uid || 'staff',
        })
        await addAuditLog(
          user?.uid || 'staff',
          'create',
          'appointments',
          `${createdId} - ${form.date} ${form.time} - total: ${Number(form.totalPrice) || 0}`,
        )
      }

      setIsFormVisible(false)
      setEditingAppointment(null)
      await loadData()
    } catch {
      Alert.alert('Save failed', 'Unable to save appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (appointmentId) => {
    try {
      await deleteAppointment(appointmentId)
      await addAuditLog(user?.uid || 'staff', 'delete', 'appointments', appointmentId)
      await loadData()
    } catch {
      Alert.alert('Delete failed', 'Unable to delete appointment. Please try again.')
    }
  }

  const confirmDelete = (appointmentId) => {
    Alert.alert(
      'Confirm delete',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: () => handleDelete(appointmentId),
        },
      ],
    )
  }

  const updateAppointmentStatus = async (
    appointment,
    status,
    totalPrice = Number(appointment.totalPrice ?? appointment.price ?? appointment.fee) || 0,
  ) => {
    setIsUpdatingStatus(true)
    try {
      await updateAppointment(appointment.id, {
        patientId: appointment.patientId,
        patientName: appointment.patientName || patientLookup.get(appointment.patientId) || '',
        date: appointment.date,
        time: appointment.time,
        status,
        totalPrice,
        dentistId: appointment.dentistId || '',
        dentistName: appointment.dentistName || appointment.dentist || '',
        services: appointment.services || [],
      })
      await addAuditLog(
        user?.uid || 'staff',
        'update',
        'appointments',
        `${appointment.id} - status: ${status} - total: ${Number(totalPrice) || 0}`,
      )
      await loadData()
      return true
    } catch {
      Alert.alert('Update failed', 'Unable to update appointment status.')
      return false
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleMarkCancel = (appointment) => {
    Alert.alert(
      'Confirm cancel',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: () =>
            updateAppointmentStatus(
              appointment,
              'cancelled',
              Number(appointment.totalPrice ?? appointment.price ?? appointment.fee) || 0,
            ),
        },
      ],
    )
  }

  const openCompleteModal = (appointment) => {
    setCompletingAppointment(appointment)
    setAmountInput(String(Number(appointment.totalPrice ?? appointment.price ?? appointment.fee) || ''))
    setIsAmountModalVisible(true)
  }

  const submitCompletedWithFee = async () => {
    if (!completingAppointment) {
      return
    }

    const parsedAmount = Number(amountInput)
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid total amount paid.')
      return
    }

    const isUpdated = await updateAppointmentStatus(
      completingAppointment,
      'completed',
      parsedAmount,
    )

    if (isUpdated) {
      setIsAmountModalVisible(false)
      setCompletingAppointment(null)
      setAmountInput('')
    }
  }

  const renderItem = ({ item }) => {
    const normalizedStatus = item.status === 'cancel' ? 'cancelled' : item.status || 'pending'
    const isFinalStatus = normalizedStatus === 'completed' || normalizedStatus === 'cancelled'
    const isCompleted = normalizedStatus === 'completed'

    return (
      <View style={[styles.card, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, { color: colors.strongText }]}>{patientLookup.get(item.patientId) || 'Unknown patient'}</Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.iconButton, isCompleted && styles.iconButtonDisabled]}
              disabled={isCompleted}
              onPress={() => {
                if (isCompleted) {
                  return
                }

                setEditingAppointment(item)
                setIsFormVisible(true)
              }}
            >
              <Ionicons name="create-outline" size={18} color="#1d4ed8" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => confirmDelete(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.detail, { color: colors.labelText }]}>Date: {item.date} at {item.time}</Text>
        <Text style={[styles.detail, { color: colors.labelText }]}>Status: {normalizedStatus}</Text>
        <Text style={[styles.detail, { color: colors.labelText }]}>Dentist: {item.dentistName || item.dentist || 'Not assigned'}</Text>
        <Text style={[styles.detail, { color: colors.labelText }]}>Services: {getAppointmentServiceList(item)}</Text>
        <Text style={[styles.detail, { color: colors.labelText }]}>Total: {formatPeso(item.totalPrice ?? item.price ?? item.fee)}</Text>
        {item.progressNote ? (
          <Text style={[styles.detail, { color: colors.labelText, fontStyle: 'italic' }]}>Note: {item.progressNote}</Text>
        ) : null}

        {isFinalStatus ? (
          <View style={[styles.finalStatusBadge, normalizedStatus === 'completed' ? styles.finalCompleted : styles.finalCancelled]}>
            <Text
              style={[
                styles.finalStatusText,
                normalizedStatus === 'completed'
                  ? styles.finalCompletedText
                  : styles.finalCancelledText,
              ]}
            >
              {normalizedStatus === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
          </View>
        ) : (
          <View style={styles.statusActions}>
            <Pressable
              style={[styles.statusActionButton, styles.completeButton]}
              onPress={() => openCompleteModal(item)}
            >
              <Text style={styles.statusActionText}>Completed</Text>
            </Pressable>
            <Pressable
              style={[styles.statusActionButton, styles.cancelButton]}
              onPress={() => handleMarkCancel(item)}
            >
              <Text style={styles.statusActionText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  if (isLoading) {
    return <LoadingOverlay label="Loading appointments..." />
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      <View style={styles.filterWrap}>
        <FormField
          label="Filter by date (YYYY-MM-DD)"
          value={filterDate}
          onChangeText={(text) => setFilterDate(formatDateInput(text))}
          placeholder="2026-03-21"
          keyboardType="number-pad"
          maxLength={10}
        />

        <Text style={[styles.statusLabel, { color: colors.labelText }]}>Status Filter</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((status) => {
            const isActive = status === filterStatus
            return (
              <Pressable
                key={status}
                style={[
                  styles.statusChip,
                  { borderColor: colors.inputBorder, backgroundColor: colors.panelBg },
                  isActive && styles.statusChipActive,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.statusChipText, { color: colors.labelText }, isActive && styles.statusChipTextActive]}>
                  {status}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {error ? <Text style={[styles.error, { backgroundColor: colors.dangerBg, color: colors.dangerText }]}>{error}</Text> : null}
      {holidayError ? <Text style={[styles.error, { backgroundColor: '#fff7ed', color: '#b45309' }]}>{holidayError}</Text> : null}

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedText }]}>No appointments found.</Text>}
      />

      <Pressable
        style={styles.fab}
        onPress={() => {
          setEditingAppointment(null)
          setIsFormVisible(true)
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>

      <AppointmentFormModal
        visible={isFormVisible}
        appointment={editingAppointment}
        patients={patients}
        dentists={dentists}
        services={services}
        holidayDates={holidayDates}
        isHolidayLoading={isHolidayLoading}
        holidayError={holidayError}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsFormVisible(false)
          setEditingAppointment(null)
        }}
        onSubmit={handleSave}
      />

      <Modal
        visible={isAmountModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAmountModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg, borderColor: colors.line }]}> 
            <Text style={[styles.modalTitle, { color: colors.strongText }]}>Complete Appointment</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>Confirm the final service amount paid</Text>
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.inputPlaceholder}
              style={[
                styles.amountInput,
                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setIsAmountModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText, { color: colors.modalCancelText }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalSaveButton]}
                disabled={isUpdatingStatus}
                onPress={submitCompletedWithFee}
              >
                <Text style={styles.modalButtonText}>{isUpdatingStatus ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  completeButton: {
    backgroundColor: '#16a34a',
  },
  detail: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  empty: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  finalCancelled: {
    backgroundColor: '#fee2e2',
  },
  finalCancelledText: {
    color: '#b91c1c',
  },
  finalCompleted: {
    backgroundColor: '#dcfce7',
  },
  finalCompletedText: {
    color: '#15803d',
  },
  finalStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  finalStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    marginHorizontal: 14,
    marginTop: 6,
    padding: 10,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 999,
    bottom: 18,
    elevation: 3,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 56,
  },
  filterWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  iconButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    padding: 8,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  listContent: {
    padding: 14,
    paddingBottom: 90,
  },
  name: {
    color: '#0f172a',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingRight: 6,
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  statusChip: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  statusChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statusChipTextActive: {
    color: '#fff',
  },
  statusLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  amountInput: {
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalButton: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
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
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  modalSaveButton: {
    backgroundColor: '#0f766e',
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  statusActionButton: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 9,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
})

export default AppointmentsScreen
