import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import FormField from '../components/FormField'
import LoadingOverlay from '../components/LoadingOverlay'
import ConfirmModal from '../components/ConfirmModal'
import PatientFormModal from '../components/forms/PatientFormModal'
import {
  addPatient,
  deletePatient,
  getPatients,
  updatePatient,
} from '../services/patientService'
import { useAuth } from '../hooks/useAuth'
import { addAuditLog } from '../services/logService'

const PatientsScreen = () => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState('')

  const loadPatients = useCallback(async () => {
    setError('')

    try {
      const data = await getPatients()
      setPatients(data)
    } catch {
      setError('Unable to load patients. Pull to refresh and try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadPatients()
    }, [loadPatients]),
  )

  const filteredPatients = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return patients
    }

    return patients.filter((patient) => patient.fullName.toLowerCase().includes(keyword))
  }, [patients, search])

  const onRefresh = () => {
    setRefreshing(true)
    loadPatients()
  }

  const handleSave = async (form) => {
    setIsSubmitting(true)

    try {
      if (editingPatient?.id) {
        await updatePatient(editingPatient.id, form)
        await addAuditLog(
          user?.uid || 'staff',
          'update',
          'patients',
          `${editingPatient.id} - ${form.fullName}`,
        )
      } else {
        const createdId = await addPatient(form)
        await addAuditLog(
          user?.uid || 'staff',
          'create',
          'patients',
          `${createdId} - ${form.fullName}`,
        )
      }

      setIsFormVisible(false)
      setEditingPatient(null)
      await loadPatients()
    } catch {
      Alert.alert('Save failed', 'Unable to save patient. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      return
    }

    try {
      await deletePatient(confirmDeleteId)
      await addAuditLog(user?.uid || 'staff', 'delete', 'patients', confirmDeleteId)
      await loadPatients()
    } catch {
      Alert.alert('Delete failed', 'Unable to delete patient. Please try again.')
    } finally {
      setConfirmDeleteId('')
    }
  }

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.fullName}</Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                setEditingPatient(item)
                setIsFormVisible(true)
              }}
            >
              <Ionicons name="create-outline" size={18} color="#1d4ed8" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setConfirmDeleteId(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.detail}>Age: {item.age}</Text>
        <Text style={styles.detail}>Gender: {item.gender}</Text>
        <Text style={styles.detail}>Contact: {item.contact}</Text>
        <Text style={styles.detail}>Address: {item.address}</Text>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingOverlay label="Loading patients..." />
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}> 
      <View style={styles.searchWrap}>
        <FormField
          label="Search patient"
          value={search}
          onChangeText={setSearch}
          placeholder="Type patient name"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No patients found.</Text>}
      />

      <Pressable
        style={styles.fab}
        onPress={() => {
          setEditingPatient(null)
          setIsFormVisible(true)
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>

      <PatientFormModal
        visible={isFormVisible}
        patient={editingPatient}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsFormVisible(false)
          setEditingPatient(null)
        }}
        onSubmit={handleSave}
      />

      <ConfirmModal
        visible={Boolean(confirmDeleteId)}
        title="Delete patient"
        message="This will permanently remove the patient record. Continue?"
        onCancel={() => setConfirmDeleteId('')}
        onConfirm={handleDelete}
      />
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
  iconButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    padding: 8,
  },
  listContent: {
    padding: 14,
    paddingBottom: 90,
  },
  name: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    paddingRight: 6,
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
})

export default PatientsScreen
