import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"
import { getStorage, FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if we're in a browser environment (not during build)
const isBrowser = typeof window !== 'undefined'

export const initFirebaseApp = (): FirebaseApp | null => {
  // Skip initialization during build time
  if (!isBrowser) {
    return null
  }

  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase config is missing. Check your environment variables.")
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }

  return getApps()[0]!
}

// Lazy initialization - only initialize when accessed
let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _storage: FirebaseStorage | null = null

export const getFirebaseApp = (): FirebaseApp => {
  if (!_app) {
    const app = initFirebaseApp()
    if (!app) throw new Error("Firebase not available during build")
    _app = app
  }
  return _app
}

export const getFirebaseAuth = (): Auth => {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp())
  }
  return _auth
}

export const getFirebaseDb = (): Firestore => {
  if (!_db) {
    _db = getFirestore(getFirebaseApp())
  }
  return _db
}

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp())
  }
  return _storage
}

// Legacy exports for backwards compatibility
export const firebaseApp = isBrowser ? getFirebaseApp() : null!
export const auth = isBrowser ? getFirebaseAuth() : null!
export const db = isBrowser ? getFirebaseDb() : null!
export const storage = isBrowser ? getFirebaseStorage() : null!
