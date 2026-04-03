import { orderBy, serverTimestamp } from 'firebase/firestore'
import { addAuditLog } from './logService'
import {
  addDocument,
  deleteDocumentById,
  getCollectionDocuments,
  updateDocumentById,
} from './firestoreService'

export const DEFAULT_DENTAL_SERVICES = [
  { name: 'Dental Check-up', price: 350 },
  { name: 'Tooth Extraction', price: 700 },
  { name: 'Orthodontic Braces Installation', price: 10000 },
  { name: 'Braces Adjustment', price: 2500 },
  { name: 'Root Canal Treatment', price: 3000 },
  { name: 'Dental Filling', price: 1500 },
  { name: 'Oral Prophylaxis / Teeth Cleaning', price: 1000 },
]

const normalizeServicePayload = ({ name, price }) => {
  return {
    name: String(name || '').trim(),
    price: Number(price) || 0,
  }
}

export const addService = async (currentUser, payload) => {
  const normalized = normalizeServicePayload(payload)
  const docRef = await addDocument('services', {
    ...normalized,
    createdAt: serverTimestamp(),
  })

  await addAuditLog(currentUser?.uid ?? 'system', 'create', 'services', normalized.name)
  return docRef.id
}

export const getServices = async () => {
  const records = await getCollectionDocuments('services', [orderBy('createdAt', 'desc')])
  return records.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
}

export const updateService = async (currentUser, serviceId, payload) => {
  const normalized = normalizeServicePayload(payload)
  await updateDocumentById('services', serviceId, normalized)
  await addAuditLog(currentUser?.uid ?? 'system', 'update', 'services', serviceId)
}

export const deleteService = async (currentUser, serviceId) => {
  await deleteDocumentById('services', serviceId)
  await addAuditLog(currentUser?.uid ?? 'system', 'delete', 'services', serviceId)
}
