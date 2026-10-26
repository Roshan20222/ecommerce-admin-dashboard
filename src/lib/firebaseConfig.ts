export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseStorageUploadsEnabled =
  import.meta.env.VITE_FIREBASE_STORAGE_ENABLED === 'true'

const configuredValues = Object.values(firebaseConfig)
const hasAnyFirebaseConfig = configuredValues.some(Boolean)
export const isFirebaseConfigured = configuredValues.every(Boolean)
export const hasPartialFirebaseConfig =
  hasAnyFirebaseConfig && !isFirebaseConfigured

export const firebaseConfigurationError = hasPartialFirebaseConfig
  ? 'Firebase configuration is incomplete. Set all VITE_FIREBASE_* values from .env.example.'
  : null
