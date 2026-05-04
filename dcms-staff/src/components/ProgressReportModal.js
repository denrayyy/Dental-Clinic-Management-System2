import { useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTheme } from '../hooks/useTheme'

const ProgressReportModal = ({
  visible,
  appointment,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme()
  const [note, setNote] = useState(appointment?.progressNote || '')

  const handleSave = () => {
    if (!note.trim()) {
      Alert.alert('Empty Note', 'Please enter a progress note before saving.')
      return
    }
    onSubmit(note)
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.modalBg, borderColor: colors.line }]}>
          <Text style={[styles.modalTitle, { color: colors.strongText }]}>Progress Report</Text>
          <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
            Add or update the progress note for this appointment.
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write progress note here..."
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            style={[
              styles.noteInput,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText },
            ]}
          />

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.modalButtonText, styles.modalCancelText, { color: colors.modalCancelText }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalSaveButton]}
              disabled={isSubmitting}
              onPress={handleSave}
            >
              <Text style={styles.modalButtonText}>{isSubmitting ? 'Saving...' : 'Save Note'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  noteInput: {
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 14,
    height: 120,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalButton: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#e2e8f0',
  },
  modalCancelText: {
    color: '#1e293b',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
  },
  modalSaveButton: {
    backgroundColor: '#0f766e',
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
})

export default ProgressReportModal
