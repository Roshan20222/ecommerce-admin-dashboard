import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import {
  firebaseConfig,
  hasPartialFirebaseConfig,
  isFirebaseConfigured,
} from './firebaseConfig'

if (hasPartialFirebaseConfig) {
  throw new Error(
    'Firebase configuration is incomplete. Set all VITE_FIREBASE_* values from .env.example.',
  )
}

export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null

export function requireFirebaseAuth() {
  if (!firebaseAuth) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and add your Firebase web app configuration.',
    )
  }

  return firebaseAuth
}

export function requireFirestore() {
  if (!firestore) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and add your Firebase web app configuration.',
    )
  }

  return firestore
}

export function requireFirebaseStorage() {
  if (!firebaseStorage) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and add your Firebase web app configuration.',
    )
  }

  return firebaseStorage
}
