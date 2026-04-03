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

const patientsCollection = collection(db, 'patients')

export const addPatient = async (payload) => {
  const cleanPayload = {
    fullName: payload.fullName.trim(),
    age: Number(payload.age),
    gender: payload.gender.trim(),
    contact: payload.contact.trim(),
    address: payload.address.trim(),
    createdBy: payload.createdBy || 'staff',
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(patientsCollection, cleanPayload)
  return docRef.id
}

export const getPatients = async () => {
  const snapshot = await getDocs(patientsCollection)
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export const getPatientsByIds = async (patientIds) => {
  const idSet = new Set((patientIds || []).filter(Boolean))

  if (!idSet.size) {
    return []
  }

  const patients = await getPatients()
  return patients.filter((patient) => idSet.has(patient.id))
}

export const updatePatient = async (id, payload) => {
  const patientRef = doc(db, 'patients', id)
  await updateDoc(patientRef, {
    fullName: payload.fullName.trim(),
    age: Number(payload.age),
    gender: payload.gender.trim(),
    contact: payload.contact.trim(),
    address: payload.address.trim(),
  })
}

export const deletePatient = async (id) => {
  const patientRef = doc(db, 'patients', id)
  await deleteDoc(patientRef)
}
