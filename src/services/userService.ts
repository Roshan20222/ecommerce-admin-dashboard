import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { requireFirestore } from '../lib/firebase'
import type { User, UserRole } from '../types/user'

const userRoles: UserRole[] = ['admin', 'editor', 'viewer']

function parseUserDate(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString()
  }

  return ''
}

function parseUser(id: string, data: Record<string, unknown>): User {
  if (
    typeof data.name !== 'string' ||
    typeof data.isActive !== 'boolean' ||
    typeof data.role !== 'string' ||
    !userRoles.includes(data.role as UserRole)
  ) {
    throw new Error(`User profile "${id}" has invalid name, role, or active status.`)
  }

  return {
    id,
    name: data.name,
    email: typeof data.email === 'string' ? data.email : '',
    ...(typeof data.avatar === 'string' ? { avatar: data.avatar } : {}),
    role: data.role as UserRole,
    isActive: data.isActive,
    lastLogin: parseUserDate(data.lastLogin),
    createdAt: parseUserDate(data.createdAt),
  }
}

export async function getUsers(): Promise<User[]> {
  const usersQuery = query(
    collection(requireFirestore(), 'users'),
    where('isActive', 'in', [true, false]),
  )
  const snapshot = await getDocs(usersQuery)

  return snapshot.docs.map((userDoc) => parseUser(userDoc.id, userDoc.data()))
}

export async function updateUserAccess(
  userId: string,
  changes: Pick<User, 'role' | 'isActive'>,
): Promise<void> {
  if (!userRoles.includes(changes.role)) {
    throw new Error('Choose a valid user role.')
  }

  await updateDoc(doc(requireFirestore(), 'users', userId), changes)
}
