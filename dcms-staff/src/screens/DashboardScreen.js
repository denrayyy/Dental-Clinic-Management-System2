import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getPatients } from '../services/patientService'
import { getAppointments } from '../services/appointmentService'
import LoadingOverlay from '../components/LoadingOverlay'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const DashboardScreen = () => {
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()
  const { colors } = useTheme()
  const [stats, setStats] = useState({
    patients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pending: 0,
    completed: 0,
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
      const [patients, appointments] = await Promise.all([getPatients(), getAppointments()])
      const todayAppointments = appointments.filter((appointment) => appointment.date === today)
      const pending = appointments.filter((appointment) => appointment.status === 'pending').length
      const completed = appointments.filter((appointment) => appointment.status === 'completed').length

      setStats({
        patients: patients.length,
        totalAppointments: appointments.length,
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

  if (isLoading) {
    return <LoadingOverlay label="Loading dashboard..." />
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Clinic Command Center</Text>
        <Text style={styles.title}>Hello, {profile?.name || 'Staff'}.</Text>
        <Text style={styles.subtitle}>Track appointments and patient flow at a glance.</Text>
        <Text style={styles.heroDate}>{readableToday}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.metricCard, styles.metricCardGreen]}>
          <Text style={styles.metricLabel}>Total Patients</Text>
          <Text style={styles.metricValue}>{stats.patients}</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardBlue]}>
          <Text style={styles.metricLabel}>Appointments Today</Text>
          <Text style={styles.metricValue}>{stats.todayAppointments}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.metricCard, styles.metricCardAmber]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={styles.metricValue}>{stats.pending}</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardMint]}>
          <Text style={styles.metricLabel}>Completed</Text>
          <Text style={styles.metricValue}>{stats.completed}</Text>
        </View>
      </View>

      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
          <Text style={[styles.quickStatLabel, { color: colors.mutedText }]}>All Appointments</Text>
          <Text style={[styles.quickStatValue, { color: colors.strongText }]}>{stats.totalAppointments}</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.panelBg, borderColor: colors.line }]}>
          <Text style={[styles.quickStatLabel, { color: colors.mutedText }]}>Completion Rate</Text>
          <Text style={[styles.quickStatValue, { color: colors.strongText }]}>
            {stats.totalAppointments
              ? `${Math.round((stats.completed / stats.totalAppointments) * 100)}%`
              : '0%'}
          </Text>
        </View>
      </View>

      {error ? <Text style={[styles.error, { backgroundColor: colors.dangerBg, color: colors.dangerText }]}>{error}</Text> : null}

      <View style={[styles.tipCard, { backgroundColor: colors.sectionBg, borderColor: colors.line }]}>
        <Text style={[styles.tipTitle, { color: colors.strongText }]}>Daily Insight</Text>
        <Text style={[styles.tipText, { color: colors.labelText }]}>
          Keep appointment statuses updated to maintain reliable analytics and smoother handoffs.
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
    borderRadius: 10,
    fontSize: 13,
    marginTop: 14,
    padding: 10,
  },
  logo: {
    alignSelf: 'center',
    height: 74,
    marginBottom: 14,
    width: 74,
  },
  screen: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    marginBottom: 14,
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
    minHeight: 102,
    padding: 14,
  },
  metricCardAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  metricCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  metricCardGreen: {
    backgroundColor: '#ecfeff',
    borderColor: '#99f6e4',
  },
  metricCardMint: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
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
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
    marginTop: 4,
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
  subtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
})

export default DashboardScreen
