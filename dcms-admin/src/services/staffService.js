import {
  getAuth,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { firebaseConfig } from '../firebase/config'
import {
  deleteDocumentById,
  setDocumentById,
  updateDocumentById,
} from './firestoreService'
import { addAuditLog } from './logService'

const createAuthUser = async (email, password) => {
  const apiKey = firebaseConfig.apiKey
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
    },
  )

  const payload = await response.json()

  if (!response.ok) {
    const errorMessage = payload?.error?.message || ''

    if (errorMessage === 'EMAIL_EXISTS') {
      throw new Error('Email already exists in Authentication.')
    }

    if (errorMessage === 'INVALID_EMAIL') {
      throw new Error('Invalid email address.')
    }

    if (errorMessage.startsWith('WEAK_PASSWORD')) {
      throw new Error('Password must be at least 6 characters.')
    }

    throw new Error(`Unable to create Authentication account (${errorMessage || 'unknown error'}).`)
  }

  if (!payload?.localId) {
    throw new Error('Authentication account was not created successfully.')
  }

  return payload.localId
}

export const createStaffWithAuthAndProfile = async (
  currentUser,
  { name, email, role, status, password },
) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const authUid = await createAuthUser(normalizedEmail, password)

  await setDocumentById('staff', authUid, {
    name,
    email: normalizedEmail,
    role,
    status,
    createdAt: serverTimestamp(),
  })

  await addAuditLog(currentUser?.uid ?? 'system', 'create', 'staff', normalizedEmail)
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

export const resetAccountPassword = async (currentUser, email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('No email address found for this account.')
  }

  await sendPasswordResetEmail(getAuth(), normalizedEmail)
  await addAuditLog(currentUser?.uid ?? 'system', 'reset-password', 'staff', normalizedEmail)
}
