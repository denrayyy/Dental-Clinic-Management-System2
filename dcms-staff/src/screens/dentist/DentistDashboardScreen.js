import { useCallback, useMemo, useState } from 'react'
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingOverlay from '../../components/LoadingOverlay'
import { useAuth } from '../../hooks/useAuth'
import { getAppointmentsByDentist } from '../../services/appointmentService'
import { getPatientsByIds } from '../../services/patientService'
import { useTheme } from '../../hooks/useTheme'

const getStatusStyles = (status) => {
  const normalized = String(status || 'pending').toLowerCase()

  if (normalized === 'completed') {
    return {
      badge: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
      text: { color: '#166534' },
    }
  }

  if (normalized === 'cancelled') {
    return {
      badge: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
      text: { color: '#991b1b' },
    }
  }

  return {
    badge: { backgroundColor: '#fef9c3', borderColor: '#fde68a' },
    text: { color: '#854d0e' },
  }
}

const DentistDashboardScreen = () => {
  const insets = useSafeAreaInsets()
  const { user, profile } = useAuth()
  const { colors } = useTheme()
  const [appointments, setAppointments] = useState([])
  const [patientsCount, setPatientsCount] = useState(0)
  const [patientLookup, setPatientLookup] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const readableToday = useMemo(
    () =>
      new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )

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
  const pendingCount = appointments.filter(
    (item) => String(item.status || 'pending').toLowerCase() === 'pending',
  ).length
  const completedCount = appointments.filter(
    (item) => String(item.status || '').toLowerCase() === 'completed',
  ).length
  const upcoming = appointments
    .filter((item) => item.date >= today)
    .slice(0, 5)

  if (isLoading) {
    return <LoadingOverlay label="Loading dashboard..." />
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Dentist Dashboard</Text>
        <Text style={styles.title}>Welcome, Dr. {profile?.name || 'Dentist'}</Text>
        <Text style={styles.subtitle}>Here is your clinic overview for today.</Text>
        <Text style={styles.heroDate}>{readableToday}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.metricCard, styles.metricCardBlue]}>
          <Text style={styles.metricLabel}>Appointments Today</Text>
          <Text style={styles.metricValue}>{todayCount}</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardGreen]}>
          <Text style={styles.metricLabel}>Assigned Patients</Text>
          <Text style={styles.metricValue}>{patientsCount}</Text>
        </View>
      </View>

      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
          <Text style={[styles.quickStatLabel, { color: colors.mutedText }]}>Pending</Text>
          <Text style={[styles.quickStatValue, { color: colors.strongText }]}>{pendingCount}</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
          <Text style={[styles.quickStatLabel, { color: colors.mutedText }]}>Completed</Text>
          <Text style={[styles.quickStatValue, { color: colors.strongText }]}>{completedCount}</Text>
        </View>
      </View>

      {error ? <Text style={[styles.error, { backgroundColor: colors.dangerBg, color: colors.dangerText }]}>{error}</Text> : null}

      <View style={[styles.sectionCard, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
        <Text style={[styles.sectionTitle, { color: colors.strongText }]}>Upcoming Appointments</Text>
        {!upcoming.length ? (
          <Text style={styles.empty}>No upcoming appointments assigned.</Text>
        ) : (
          upcoming.map((appointment) => (
            <View
              key={appointment.id}
              style={[styles.appointmentCard, { backgroundColor: colors.sectionBg, borderColor: colors.line }]}
            >
              <View style={styles.appointmentTopRow}>
                <Text style={[styles.appointmentDate, { color: colors.strongText }]}>{appointment.date} at {appointment.time}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyles(appointment.status).badge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      getStatusStyles(appointment.status).text,
                    ]}
                  >
                    {appointment.status || 'pending'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.appointmentDetail, { color: colors.labelText }]}> 
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
    borderColor: '#dbe7ff',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  appointmentTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderRadius: 10,
    fontSize: 13,
    marginTop: 12,
    padding: 10,
  },
  screen: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 16,
  },
  heroDate: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  heroEyebrow: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricCard: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 98,
    padding: 14,
  },
  metricCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  metricCardGreen: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
  },
  metricLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  logo: {
    alignSelf: 'center',
    height: 74,
    marginBottom: 14,
    width: 74,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  quickStatCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
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
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
})

export default DentistDashboardScreen
