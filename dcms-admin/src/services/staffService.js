import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { getSecondaryApp } from '../firebase/config'
import {
  deleteDocumentById,
  setDocumentById,
  updateDocumentById,
} from './firestoreService'
import { addAuditLog } from './logService'

export const createStaffWithAuthAndProfile = async (
  currentUser,
  { name, email, role, status, password },
) => {
  const secondaryAuth = getAuth(getSecondaryApp())
  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password,
  )

  await setDocumentById('staff', credential.user.uid, {
    name,
    email,
    role,
    status,
    createdAt: serverTimestamp(),
  })

  await addAuditLog(currentUser?.uid ?? 'system', 'create', 'staff', email)
  await signOut(secondaryAuth)
}

export const updateStaffProfile = async (currentUser, staffId, payload) => {
  await updateDocumentById('staff', staffId, payload)
  await addAuditLog(currentUser?.uid ?? 'system', 'update', 'staff', staffId)
}

export const deactivateStaff = async (currentUser, staffId) => {
  await updateDocumentById('staff', staffId, { status: 'inactive' })
  await addAuditLog(currentUser?.uid ?? 'system', 'update', 'staff', staffId)
}

export const activateStaff = async (currentUser, staffId) => {
  await updateDocumentById('staff', staffId, { status: 'active' })
  await addAuditLog(currentUser?.uid ?? 'system', 'update', 'staff', staffId)
}

export const deleteStaffProfile = async (currentUser, staffId) => {
  await deleteDocumentById('staff', staffId)
  await addAuditLog(currentUser?.uid ?? 'system', 'delete', 'staff', staffId)
}
