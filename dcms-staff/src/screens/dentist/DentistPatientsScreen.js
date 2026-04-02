import { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LoadingOverlay from '../../components/LoadingOverlay'
import { useAuth } from '../../hooks/useAuth'
import { getAppointmentsByDentist } from '../../services/appointmentService'
import { getPatientsByIds } from '../../services/patientService'

const DentistPatientsScreen = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setError('')

    try {
      const assignedAppointments = await getAppointmentsByDentist(user?.uid || '')
      const patientIds = Array.from(
        new Set(assignedAppointments.map((appointment) => appointment.patientId).filter(Boolean)),
      )
      const assignedPatients = await getPatientsByIds(patientIds)
      setPatients(assignedPatients)
    } catch {
      setError('Unable to load patients. Pull to refresh and try again.')
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
    return <LoadingOverlay label="Loading patients..." />
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No patients assigned.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.detail}>Age: {item.age}</Text>
            <Text style={styles.detail}>Gender: {item.gender}</Text>
            <Text style={styles.detail}>Contact: {item.contact}</Text>
            <Text style={styles.detail}>Address: {item.address}</Text>
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
    marginBottom: 8,
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
})

export default DentistPatientsScreen
