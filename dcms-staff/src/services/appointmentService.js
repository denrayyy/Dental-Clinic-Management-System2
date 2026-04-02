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

const normalizeAppointment = (item) => {
  const data = item.data()
  return {
    id: item.id,
    ...data,
    dentistId: data.dentistId || '',
    dentistName: data.dentistName || data.dentist || '',
  }
}

export const addAppointment = async (payload) => {
  const dentistName = (payload.dentistName || payload.dentist || '').trim()
  const cleanPayload = {
    patientId: payload.patientId,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    fee: Number(payload.fee) || 0,
    dentistId: (payload.dentistId || '').trim(),
    dentistName,
    dentist: dentistName,
    notes: (payload.notes || '').trim(),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(appointmentsCollection, cleanPayload)
  return docRef.id
}

export const getAppointments = async () => {
  const snapshot = await getDocs(appointmentsCollection)
  return snapshot.docs
    .map(normalizeAppointment)
    .sort((a, b) => {
      const aKey = `${a.date || ''} ${a.time || ''}`
      const bKey = `${b.date || ''} ${b.time || ''}`
      return aKey.localeCompare(bKey)
    })
}

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
  await updateDoc(appointmentRef, {
    patientId: payload.patientId,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    fee: Number(payload.fee) || 0,
    dentistId: (payload.dentistId || '').trim(),
    dentistName,
    dentist: dentistName,
    notes: (payload.notes || '').trim(),
  })
}

export const deleteAppointment = async (id) => {
  const appointmentRef = doc(db, 'appointments', id)
  await deleteDoc(appointmentRef)
}
