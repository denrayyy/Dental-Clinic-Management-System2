import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const appointmentsCollection = collection(db, 'appointments')

const normalizeServiceEntry = (service) => {
  const serviceId = String(service?.serviceId || service?.id || '').trim()
  const name = String(service?.name || service?.serviceName || '').trim()
  const price = Number(service?.price) || 0

  if (!serviceId || !name) {
    return null
  }

  return {
    serviceId,
    name,
    price,
  }
}

const buildLegacyServiceEntries = (data) => {
  const serviceId = String(data?.serviceId || '').trim()
  const name = String(data?.serviceName || '').trim()
  const price = Number(data?.price ?? data?.fee) || 0

  if (!serviceId || !name) {
    return []
  }

  return [{ serviceId, name, price }]
}

const buildServicesArray = (payload) => {
  const normalized = Array.isArray(payload?.services)
    ? payload.services.map(normalizeServiceEntry).filter(Boolean)
    : []

  if (normalized.length) {
    return normalized
  }

  return buildLegacyServiceEntries(payload)
}

const sumServicesTotal = (services) => {
  return services.reduce((sum, service) => sum + (Number(service.price) || 0), 0)
}

const normalizeAppointment = (item) => {
  const data = item.data()
  const services = buildServicesArray(data)
  const computedTotal = sumServicesTotal(services)
  const totalPrice = Number(data.totalPrice)
  const resolvedTotal = Number.isFinite(totalPrice) && totalPrice >= 0
    ? totalPrice
    : computedTotal || Number(data.price ?? data.fee) || 0

  const primaryService = services[0] || null

  return {
    id: item.id,
    ...data,
    dentistId: data.dentistId || '',
    dentistName: data.dentistName || data.dentist || '',
    services,
    totalPrice: resolvedTotal,
    serviceId: data.serviceId || primaryService?.serviceId || '',
    serviceName: data.serviceName || primaryService?.name || '',
    price: Number(data.price ?? data.fee ?? resolvedTotal) || resolvedTotal,
    progressNote: data.progressNote || '',
  }
}

export const createAppointment = async (payload) => {
  const dentistName = (payload.dentistName || payload.dentist || '').trim()
  const services = buildServicesArray(payload)
  const totalPrice = Number(payload.totalPrice)
  const resolvedTotal = Number.isFinite(totalPrice) && totalPrice >= 0
    ? totalPrice
    : sumServicesTotal(services)
  const createdBy = String(payload.createdBy || '').trim() || 'staff'
  const patientName = String(payload.patientName || '').trim()

  const cleanPayload = {
    patientId: payload.patientId,
    patientName,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    services,
    totalPrice: resolvedTotal,
    dentistId: (payload.dentistId || '').trim(),
    dentistName,
    dentist: dentistName,
    createdBy,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(appointmentsCollection, cleanPayload)
  return docRef.id
}

export const getAppointments = async () => {
  const snapshot = await getDocs(appointmentsCollection)
  return snapshot.docs
    .map(normalizeAppointment)
    .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
}

export const addAppointment = createAppointment

export const getAppointmentsByDentist = async (dentistId) => {
  const dentistQuery = query(appointmentsCollection, where('dentistId', '==', dentistId))
  const snapshot = await getDocs(dentistQuery)

  return snapshot.docs
    .map(normalizeAppointment)
    .sort((a, b) => {
      const aKey = `${a.date || ''} ${a.time || ''}`
      const bKey = `${b.date || ''} ${b.time || ''}`
      return aKey.localeCompare(bKey)
    })
}

export const updateAppointment = async (id, payload) => {
  const appointmentRef = doc(db, 'appointments', id)
  const dentistName = (payload.dentistName || payload.dentist || '').trim()
  const services = buildServicesArray(payload)
  const totalPrice = Number(payload.totalPrice)
  const resolvedTotal = Number.isFinite(totalPrice) && totalPrice >= 0
    ? totalPrice
    : sumServicesTotal(services)
  const patientName = String(payload.patientName || '').trim()

  const updateData = {
    patientId: payload.patientId,
    patientName,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    services,
    totalPrice: resolvedTotal,
    dentistId: (payload.dentistId || '').trim(),
    dentistName,
    dentist: dentistName,
  }

  if (typeof payload.progressNote === 'string') {
    updateData.progressNote = payload.progressNote
  }

  await updateDoc(appointmentRef, updateData)
}

export const deleteAppointment = async (id) => {
  const appointmentRef = doc(db, 'appointments', id)
  await deleteDoc(appointmentRef)
}
