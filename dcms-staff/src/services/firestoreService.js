import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase/config'

export const addDocument = async (collectionName, payload) => {
  return addDoc(collection(db, collectionName), payload)
}
