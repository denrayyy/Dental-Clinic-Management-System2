import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

const ConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={[styles.buttonText, styles.cancelText]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  button: {
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelText: {
    color: '#1e293b',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  confirmText: {
    color: '#fff',
  },
  message: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
})

export default ConfirmModal
