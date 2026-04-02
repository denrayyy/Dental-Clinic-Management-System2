import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingOverlay from '../../components/LoadingOverlay'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { getAppointmentsByDentist } from '../../services/appointmentService'
import { getPatientsByIds } from '../../services/patientService'

const DentistDashboardScreen = () => {
  const insets = useSafeAreaInsets()
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [patientsCount, setPatientsCount] = useState(0)
  const [patientLookup, setPatientLookup] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadDashboard = useCallback(async () => {
    setError('')

    try {
      const assignedAppointments = await getAppointmentsByDentist(user?.uid || '')
      const uniquePatientIds = Array.from(
        new Set(assignedAppointments.map((item) => item.patientId).filter(Boolean)),
      )
      const assignedPatients = await getPatientsByIds(uniquePatientIds)
      const nextLookup = new Map()
      assignedPatients.forEach((patient) => {
        nextLookup.set(patient.id, patient.fullName)
      })

      setAppointments(assignedAppointments)
      setPatientsCount(assignedPatients.length)
      setPatientLookup(nextLookup)
    } catch {
      setError('Unable to load dashboard data. Pull to refresh and try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user?.uid])

  useFocusEffect(
    useCallback(() => {
      loadDashboard()
    }, [loadDashboard]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  const todayCount = appointments.filter((item) => item.date === today).length
  const upcoming = appointments
    .filter((item) => item.date >= today)
    .slice(0, 5)

  if (isLoading) {
    return <LoadingOverlay label="Loading dashboard..." />
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Welcome, Dr. {profile?.name || 'Dentist'}</Text>
      <Text style={styles.subtitle}>Here is your clinic overview for today.</Text>

      <View style={styles.statsRow}>
        <StatCard label="Appointments Today" value={todayCount} color="#1d4ed8" />
        <StatCard label="Assigned Patients" value={patientsCount} color="#0f766e" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {!upcoming.length ? (
          <Text style={styles.empty}>No upcoming appointments assigned.</Text>
        ) : (
          upcoming.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <Text style={styles.appointmentDate}>{appointment.date} at {appointment.time}</Text>
              <Text style={styles.appointmentDetail}>Status: {appointment.status || 'pending'}</Text>
              <Text style={styles.appointmentDetail}>
                Patient: {patientLookup.get(appointment.patientId) || 'Unknown patient'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  appointmentDate: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  appointmentDetail: {
    color: '#475569',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  empty: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
  },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 12,
    padding: 10,
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
})

export default DentistDashboardScreen
