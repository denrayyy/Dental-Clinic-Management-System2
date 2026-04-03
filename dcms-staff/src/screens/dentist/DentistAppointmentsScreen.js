import { useCallback, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
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

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No appointments assigned.</Text>}
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
    marginTop: 16,
    textAlign: 'center',
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
})

export default DentistAppointmentsScreen
