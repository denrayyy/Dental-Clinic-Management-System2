import { serverTimestamp } from 'firebase/firestore'
import { addDocument } from './firestoreService'

export const addAuditLog = async (userId, action, module, details = '') => {
  try {
    await addDocument('logs', {
      userId,
      action,
      module,
      details,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error('Failed to add audit log:', error)
  }
}
