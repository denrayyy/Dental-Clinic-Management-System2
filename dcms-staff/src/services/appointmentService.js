import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const appointmentsCollection = collection(db, 'appointments')

export const addAppointment = async (payload) => {
  const cleanPayload = {
    patientId: payload.patientId,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    fee: Number(payload.fee) || 0,
    dentist: (payload.dentist || '').trim(),
    notes: (payload.notes || '').trim(),
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(appointmentsCollection, cleanPayload)
  return docRef.id
}

export const getAppointments = async () => {
  const snapshot = await getDocs(appointmentsCollection)
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => {
      const aKey = `${a.date || ''} ${a.time || ''}`
      const bKey = `${b.date || ''} ${b.time || ''}`
      return aKey.localeCompare(bKey)
    })
}

export const updateAppointment = async (id, payload) => {
  const appointmentRef = doc(db, 'appointments', id)
  await updateDoc(appointmentRef, {
    patientId: payload.patientId,
    date: payload.date,
    time: payload.time,
    status: payload.status || 'pending',
    fee: Number(payload.fee) || 0,
    dentist: (payload.dentist || '').trim(),
    notes: (payload.notes || '').trim(),
  })
}

export const deleteAppointment = async (id) => {
  const appointmentRef = doc(db, 'appointments', id)
  await deleteDoc(appointmentRef)
}
