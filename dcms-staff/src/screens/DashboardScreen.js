import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Image, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getPatients } from '../services/patientService'
import { getAppointments } from '../services/appointmentService'
import StatCard from '../components/StatCard'
import LoadingOverlay from '../components/LoadingOverlay'
import { useAuth } from '../hooks/useAuth'

const DashboardScreen = () => {
  const insets = useSafeAreaInsets()
  const { profile, logout } = useAuth()
  const [stats, setStats] = useState({
    patients: 0,
    todayAppointments: 0,
    pending: 0,
    completed: 0,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadDashboard = useCallback(async () => {
    setError('')

    try {
      const [patients, appointments] = await Promise.all([getPatients(), getAppointments()])
      const todayAppointments = appointments.filter((appointment) => appointment.date === today)
      const pending = appointments.filter((appointment) => appointment.status === 'pending').length
      const completed = appointments.filter((appointment) => appointment.status === 'completed').length

      setStats({
        patients: patients.length,
        todayAppointments: todayAppointments.length,
        pending,
        completed,
      })
    } catch (loadError) {
      setError('Unable to load dashboard stats. Pull to refresh and try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [today])

  useFocusEffect(
    useCallback(() => {
      loadDashboard()
    }, [loadDashboard]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  const handleLogoutPress = () => {
    Alert.alert('Confirm logout', 'Are you sure you want to log out?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, logout', style: 'destructive', onPress: logout },
    ])
  }

  if (isLoading) {
    return <LoadingOverlay label="Loading dashboard..." />
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Clinic Dashboard</Text>
          <Text style={styles.subtitle}>Hello, {profile?.name || 'Staff'}.</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogoutPress}>
          <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Total Patients" value={stats.patients} color="#0f766e" />
        <StatCard label="Appointments Today" value={stats.todayAppointments} color="#1d4ed8" />
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Pending" value={stats.pending} color="#d97706" />
        <StatCard label="Completed" value={stats.completed} color="#16a34a" />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Quick Note</Text>
        <Text style={styles.tipText}>
          Keep appointment statuses updated so dashboard numbers stay accurate in real time.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  error: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 14,
    padding: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logo: {
    alignSelf: 'center',
    height: 74,
    marginBottom: 14,
    width: 74,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  tipText: {
    color: '#155e75',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  tipTitle: {
    color: '#0e7490',
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
  },
})

export default DashboardScreen
