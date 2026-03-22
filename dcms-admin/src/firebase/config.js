import { initializeApp, getApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export const firebaseConfig = {
  apiKey: 'AIzaSyBnjKpw1yhunZ-BOsc_wDTGDYqBoGzfSCI',
  authDomain: 'yoona-app-8debf.firebaseapp.com',
  projectId: 'yoona-app-8debf',
  storageBucket: 'yoona-app-8debf.firebasestorage.app',
  messagingSenderId: '106803684974',
  appId: '1:106803684974:web:662fce7c1007b35edf687f',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

export const getSecondaryApp = () => {
  const appName = 'staff-creation-app'
  const existing = getApps().find((instance) => instance.name === appName)
  return existing ?? initializeApp(firebaseConfig, appName)
}
