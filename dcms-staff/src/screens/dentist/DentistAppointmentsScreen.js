import { useCallback, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingOverlay from '../../components/LoadingOverlay'
import ProgressReportModal from '../../components/ProgressReportModal'
import { useAuth } from '../../hooks/useAuth'
import { getAppointmentsByDentist, updateAppointment } from '../../services/appointmentService'
import { getPatients } from '../../services/patientService'
import { useTheme } from '../../hooks/useTheme'

const getAppointmentServiceList = (appointment) => {
  if (Array.isArray(appointment?.services) && appointment.services.length) {
    return appointment.services
      .map((service) => service.name)
      .filter(Boolean)
      .join(', ')
  }

  return appointment?.serviceName || 'Not selected'
}

const DentistAppointmentsScreen = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { colors } = useTheme()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isReportModalVisible, setIsReportModalVisible] = useState(false)
  const [reportingAppointment, setReportingAppointment] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const statusOptions = useMemo(() => ['all', 'pending', 'completed'], [])

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return appointments.filter((appointment) => {
      const normalizedStatus = String(appointment.status || 'pending').toLowerCase()
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!query) {
        return true
      }

      const patientName = String(patientLookup.get(appointment.patientId) || '').toLowerCase()
      const appointmentDate = String(appointment.date || '').toLowerCase()
      const appointmentTime = String(appointment.time || '').toLowerCase()
      const services = String(getAppointmentServiceList(appointment) || '').toLowerCase()

      return (
        patientName.includes(query) ||
        appointmentDate.includes(query) ||
        appointmentTime.includes(query) ||
        normalizedStatus.includes(query) ||
        services.includes(query)
      )
    })
  }, [appointments, patientLookup, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all'

  const loadData = useCallback(async () => {
    setError('')

    try {
      const [assignedAppointments, allPatients] = await Promise.all([
        getAppointmentsByDentist(user?.uid || ''),
        getPatients(),
      ])

      setAppointments(assignedAppointments)
      setPatients(allPatients)
    } catch {
      setError('Unable to load appointments. Pull to refresh and try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user?.uid])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleSaveReport = async (note) => {
    if (!reportingAppointment) return

    setIsSubmitting(true)
    try {
      await updateAppointment(reportingAppointment.id, {
        ...reportingAppointment,
        progressNote: note,
      })
      await loadData()
      setIsReportModalVisible(false)
      setReportingAppointment(null)
    } catch (e) {
      Alert.alert('Save Failed', 'Unable to save the progress report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingOverlay label="Loading appointments..." />
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      {error ? <Text style={[styles.error, { backgroundColor: colors.dangerBg, color: colors.dangerText }]}>{error}</Text> : null}

      <View style={styles.controlsWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search patient, service, date, status"
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.searchInput,
            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
          ]}
        />
        <View style={styles.filterRow}>
          {statusOptions.map((status) => {
            const isActive = statusFilter === status
            return (
              <Pressable
                key={status}
                style={[
                  styles.filterChip,
                  { borderColor: colors.inputBorder, backgroundColor: colors.panelBg },
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterChipText, { color: colors.labelText }, isActive && styles.filterChipTextActive]}>
                  {status === 'all' ? 'All' : status}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.listContent,
          filteredAppointments.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedText }]}>
            {hasActiveFilters ? 'No appointments match your search or filter.' : 'No appointments assigned.'}
          </Text>
        }
        renderItem={({ item }) => {
          const normalizedStatus = String(item.status || 'pending').toLowerCase()
          const isCompleted = normalizedStatus === 'completed'
          return (
            <View style={[styles.card, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: colors.strongText }]}>
                  {patientLookup.get(item.patientId) || 'Unknown patient'}
                </Text>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => {
                    setReportingAppointment(item)
                    setIsReportModalVisible(true)
                  }}
                >
                  <Ionicons name="document-text-outline" size={18} color="#1d4ed8" />
                </Pressable>
              </View>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isCompleted ? styles.statusBadgeCompleted : styles.statusBadgePending,
                  ]}
                >
                  <Text style={isCompleted ? styles.statusTextCompleted : styles.statusTextPending}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.detail, { color: colors.labelText }]}>Date: {item.date} at {item.time}</Text>
              <Text style={[styles.detail, { color: colors.labelText }]}>Status: {item.status || 'pending'}</Text>
              <Text style={[styles.detail, { color: colors.labelText }]}>Services: {getAppointmentServiceList(item)}</Text>
              <Text style={[styles.detail, { color: colors.labelText }]}>Total: {formatPeso(item.totalPrice ?? item.price ?? item.fee)}</Text>
              {item.progressNote ? (
                <Text style={[styles.detail, { color: colors.labelText, fontStyle: 'italic' }]}>Note: {item.progressNote}</Text>
              ) : null}
            </View>
          )
        }}
      />

      {reportingAppointment ? (
        <ProgressReportModal
          visible={isReportModalVisible}
          appointment={reportingAppointment}
          isSubmitting={isSubmitting}
          onClose={() => {
            setIsReportModalVisible(false)
            setReportingAppointment(null)
          }}
          onSubmit={handleSaveReport}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginBottom: 6,
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
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  filterChip: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  controlsWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    marginHorizontal: 14,
    marginTop: 10,
    padding: 10,
  },
  iconButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    padding: 8,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  name: {
    color: '#0f172a',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingRight: 6,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  statusBadgePending: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde68a',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusTextCompleted: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#854d0e',
    fontSize: 12,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})

export default DentistAppointmentsScreen
