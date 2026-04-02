import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const staffCollection = collection(db, 'staff')

const normalizeDentists = (docs) => {
  return docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .filter((member) => {
      const status = String(member.status || 'active').toLowerCase()
      return status === 'active'
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .map((member) => ({
      id: member.id,
      name: member.name || 'Dentist',
      email: member.email || '',
      role: 'dentist',
      licenseNumber: member.licenseNumber || '',
    }))
}

export const getActiveDentists = async () => {
  const lowercaseQuery = query(staffCollection, where('role', '==', 'dentist'))
  const uppercaseQuery = query(staffCollection, where('role', '==', 'Dentist'))

  const [lowercaseSnap, uppercaseSnap] = await Promise.all([
    getDocs(lowercaseQuery),
    getDocs(uppercaseQuery),
  ])

  const merged = [...lowercaseSnap.docs, ...uppercaseSnap.docs]
  const uniqueById = new Map()

  normalizeDentists(merged).forEach((dentist) => {
    uniqueById.set(dentist.id, dentist)
  })

  return Array.from(uniqueById.values())
}