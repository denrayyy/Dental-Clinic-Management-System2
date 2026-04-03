import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../firebase/config'

const servicesCollection = collection(db, 'services')

const normalizeService = (docSnapshot) => {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    name: String(data.name || '').trim(),
    price: Number(data.price) || 0,
  }
}

export const fetchServices = async () => {
  const snapshot = await getDocs(query(servicesCollection))

  return snapshot.docs
    .map(normalizeService)
    .filter((service) => service.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
}
