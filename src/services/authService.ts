import { doc, getDoc } from 'firebase/firestore'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import type { Unsubscribe } from 'firebase/firestore'
import { requireFirebaseAuth, requireFirestore } from '../lib/firebase'
import type { User, UserRole } from '../types/user'

const userRoles: UserRole[] = ['admin', 'editor', 'viewer']

function toIsoDate(value: unknown, fallback: string): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString()
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString()
  }

  return fallback
}

async function getAdminUser(firebaseUser: FirebaseUser): Promise<User> {
  const profileSnapshot = await getDoc(
    doc(requireFirestore(), 'users', firebaseUser.uid),
  )

  if (!profileSnapshot.exists()) {
    throw new Error('Your account does not have an admin profile.')
  }

  const profile = profileSnapshot.data()
  const role = profile.role as UserRole

  if (!userRoles.includes(role) || typeof profile.isActive !== 'boolean') {
    throw new Error('Your admin profile is missing a valid role or active status.')
  }

  if (!profile.isActive) {
    throw new Error('This account is inactive. Contact an administrator.')
  }

  const email = firebaseUser.email
  if (!email) {
    throw new Error('The authenticated account does not have an email address.')
  }

  const name =
    typeof profile.name === 'string' ? profile.name : firebaseUser.displayName
  if (!name) {
    throw new Error('Your admin profile is missing a display name.')
  }

  return {
    id: firebaseUser.uid,
    name,
    email,
    avatar:
      typeof profile.avatar === 'string'
        ? profile.avatar
        : firebaseUser.photoURL ?? undefined,
    role,
    isActive: profile.isActive,
    lastLogin: firebaseUser.metadata.lastSignInTime ?? '',
    createdAt: toIsoDate(
      profile.createdAt,
      firebaseUser.metadata.creationTime ?? '',
    ),
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  const auth = requireFirebaseAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)

  try {
    return await getAdminUser(credential.user)
  } catch (error) {
    await firebaseSignOut(auth)
    throw error
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(requireFirebaseAuth())
}

export function subscribeToAuthState(
  onUser: (user: User | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const auth = requireFirebaseAuth()

  return onAuthStateChanged(
    auth,
    (firebaseUser) => {
      if (!firebaseUser) {
        onUser(null)
        return
      }

      void getAdminUser(firebaseUser)
        .then(onUser)
        .catch((error: unknown) => {
          onError(
            error instanceof Error
              ? error
              : new Error('Failed to load the authenticated user profile.'),
          )
        })
    },
    (error) => onError(error),
  )
}
