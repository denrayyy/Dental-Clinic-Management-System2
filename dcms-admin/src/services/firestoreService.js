import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const buildQuery = (collectionName, queryConstraints = []) => {
  const colRef = collection(db, collectionName)
  if (!queryConstraints.length) {
    return colRef
  }
  return query(colRef, ...queryConstraints)
}

export const addDocument = async (collectionName, payload) => {
  return addDoc(collection(db, collectionName), payload)
}

export const setDocumentById = async (collectionName, id, payload) => {
  return setDoc(doc(db, collectionName, id), payload)
}

export const updateDocumentById = async (collectionName, id, payload) => {
  return updateDoc(doc(db, collectionName, id), payload)
}

export const deleteDocumentById = async (collectionName, id) => {
  return deleteDoc(doc(db, collectionName, id))
}

export const getDocumentById = async (collectionName, id) => {
  const snapshot = await getDoc(doc(db, collectionName, id))
  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export const getCollectionDocuments = async (
  collectionName,
  queryConstraints = [],
) => {
  const snapshot = await getDocs(buildQuery(collectionName, queryConstraints))
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }))
}

export const subscribeToCollection = (
  collectionName,
  queryConstraints,
  onData,
  onError,
) => {
  return onSnapshot(
    buildQuery(collectionName, queryConstraints),
    (snapshot) => {
      const records = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }))
      onData(records)
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    },
  )
}
