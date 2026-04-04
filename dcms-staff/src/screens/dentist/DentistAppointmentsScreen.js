import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingOverlay from '../../components/LoadingOverlay'
import { useAuth } from '../../hooks/useAuth'
import { getAppointmentsByDentist } from '../../services/appointmentService'
import { getPatients } from '../../services/patientService'

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
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const statusOptions = useMemo(() => {
    const dynamicStatuses = Array.from(
      new Set(appointments.map((appointment) => String(appointment.status || 'pending').toLowerCase())),
    )
    const baseStatuses = ['all', 'pending']

    return Array.from(new Set([...baseStatuses, ...dynamicStatuses]))
  }, [appointments])

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

  if (isLoading) {
    return <LoadingOverlay label="Loading appointments..." />
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.controlsWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search patient, service, date, status"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          {statusOptions.map((status) => {
            const isActive = statusFilter === status
            return (
              <Pressable
                key={status}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
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
          <Text style={styles.empty}>
            {hasActiveFilters ? 'No appointments match your search or filter.' : 'No appointments assigned.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{patientLookup.get(item.patientId) || 'Unknown patient'}</Text>
            <Text style={styles.detail}>Date: {item.date} at {item.time}</Text>
            <Text style={styles.detail}>Status: {item.status || 'pending'}</Text>
            <Text style={styles.detail}>Services: {getAppointmentServiceList(item)}</Text>
            <Text style={styles.detail}>Total: {formatPeso(item.totalPrice ?? item.price ?? item.fee)}</Text>
          </View>
        )}
      />
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
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  name: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
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
