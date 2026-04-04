import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')

  const genderOptions = useMemo(() => {
    const dynamicGenders = Array.from(
      new Set(patients.map((patient) => String(patient.gender || 'unspecified').toLowerCase())),
    )
    const baseGenders = ['all', 'male']

    return Array.from(new Set([...baseGenders, ...dynamicGenders]))
  }, [patients])

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return patients.filter((patient) => {
      const normalizedGender = String(patient.gender || 'unspecified').toLowerCase()
      const matchesGender = genderFilter === 'all' || normalizedGender === genderFilter

      if (!matchesGender) {
        return false
      }

      if (!query) {
        return true
      }

      return [patient.fullName, patient.contact, patient.address, patient.gender, patient.age]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query))
    })
  }, [genderFilter, patients, searchQuery])

  const hasActiveFilters = searchQuery.trim().length > 0 || genderFilter !== 'all'

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

      <View style={styles.controlsWrap}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name, contact, address"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          {genderOptions.map((gender) => {
            const isActive = genderFilter === gender
            return (
              <Pressable
                key={gender}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setGenderFilter(gender)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {gender === 'all' ? 'All' : gender}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredPatients.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {hasActiveFilters ? 'No patients match your search or filter.' : 'No patients assigned.'}
          </Text>
        }
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
    marginBottom: 8,
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

export default DentistPatientsScreen
