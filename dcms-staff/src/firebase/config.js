import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { initializeApp, getApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBnjKpw1yhunZ-BOsc_wDTGDYqBoGzfSCI',
  authDomain: 'yoona-app-8debf.firebaseapp.com',
  projectId: 'yoona-app-8debf',
  storageBucket: 'yoona-app-8debf.firebasestorage.app',
  messagingSenderId: '106803684974',
  appId: '1:106803684974:web:0d570869f69ffa44df687f',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

let auth

if (Platform.OS === 'web') {
  auth = getAuth(app)
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch {
    auth = getAuth(app)
  }
}

const db = getFirestore(app)

export { app, auth, db }
