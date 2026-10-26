import {
  deleteField,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage'
import {
  requireFirebaseStorage,
  requireFirestore,
} from '../lib/firebase'
import type {
  Product,
  ProductCategory,
  ProductStatus,
} from '../types/product'

export interface ProductWriteData {
  name: string
  description: string
  price: number
  compareAtPrice?: number
  stock: number
  category: ProductCategory
  status: ProductStatus
  sku: string
  tags: string[]
  newImages: File[]
  existingImages: string[]
}

export interface ProductImageUploadProgress {
  stage: 'uploading' | 'saving'
  fileIndex: number
  fileCount: number
  percent: number
}

function waitForUpload(
  task: UploadTask,
  fileIndex: number,
  fileCount: number,
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      task.cancel()
      reject(
        new Error(
          'Image upload timed out after 60 seconds. Check your connection and Firebase Storage setup, then try again.',
        ),
      )
    }, 60_000)

    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.({
          stage: 'uploading',
          fileIndex,
          fileCount,
          percent: Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          ),
        })
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(formatStorageError(error))
      },
      () => {
        window.clearTimeout(timeoutId)
        resolve()
      },
    )
  })
}

function formatStorageError(error: Error & { code?: string }): Error {
  switch (error.code) {
    case 'storage/unauthorized':
      return new Error(
        'Firebase Storage denied this upload. Publish storage.rules and confirm your Firestore profile has role "admin" or "editor" and isActive set to true.',
      )
    case 'storage/bucket-not-found':
    case 'storage/no-default-bucket':
      return new Error(
        'The Firebase Storage bucket was not found. Create the default bucket in Firebase Console → Build → Storage, then verify VITE_FIREBASE_STORAGE_BUCKET in .env.local.',
      )
    case 'storage/canceled':
      return new Error('Image upload was canceled.')
    case 'storage/retry-limit-exceeded':
    case 'storage/unknown':
      return new Error(
        `Firebase Storage could not complete the upload. Check that Storage is enabled, the bucket is correct, and the browser is online. (${error.code})`,
      )
    default:
      return error
  }
}

function parseProductDate(value: unknown, fieldName: string): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString()
  }

  throw new Error(`Product ${fieldName} is missing or invalid.`)
}

function parseProduct(id: string, value: Record<string, unknown>): Product {
  const categories: ProductCategory[] = [
    'electronics',
    'clothing',
    'furniture',
    'books',
    'sports',
    'beauty',
    'food',
    'other',
  ]
  const statuses: ProductStatus[] = ['active', 'draft', 'archived']

  if (
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.price !== 'number' ||
    value.price < 0 ||
    typeof value.stock !== 'number' ||
    !Number.isInteger(value.stock) ||
    value.stock < 0 ||
    typeof value.category !== 'string' ||
    !categories.includes(value.category as ProductCategory) ||
    typeof value.status !== 'string' ||
    !statuses.includes(value.status as ProductStatus) ||
    !Array.isArray(value.images) ||
    !value.images.every((image) => typeof image === 'string') ||
    typeof value.sku !== 'string' ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === 'string')
  ) {
    throw new Error(`Product "${id}" has invalid data in Firestore.`)
  }

  const compareAtPrice =
    typeof value.compareAtPrice === 'number' ? value.compareAtPrice : undefined

  return {
    id,
    name: value.name,
    description: value.description,
    price: value.price,
    ...(compareAtPrice === undefined ? {} : { compareAtPrice }),
    stock: value.stock,
    category: value.category as ProductCategory,
    status: value.status as ProductStatus,
    images: value.images,
    sku: value.sku,
    tags: value.tags,
    createdAt: parseProductDate(value.createdAt, 'createdAt'),
    updatedAt: parseProductDate(value.updatedAt, 'updatedAt'),
  }
}

export async function getProducts(): Promise<Product[]> {
  const productsQuery = query(
    collection(requireFirestore(), 'products'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(productsQuery)

  return snapshot.docs.map((productDoc) =>
    parseProduct(productDoc.id, productDoc.data()),
  )
}

async function uploadProductImages(
  productId: string,
  files: File[],
  uploadedImagePaths: string[],
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<string[]> {
  if (files.length === 0) {
    return []
  }

  const storage = requireFirebaseStorage()

  const imageUrls: string[] = []

  for (const [index, file] of files.entries()) {
    const imagePath = `products/${productId}/${crypto.randomUUID()}`
    const imageRef = ref(storage, imagePath)
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Reconnect and try saving again.')
    }

    const uploadTask = uploadBytesResumable(imageRef, file, {
      contentType: file.type,
    })
    await waitForUpload(uploadTask, index + 1, files.length, onProgress)
    uploadedImagePaths.push(imagePath)
    imageUrls.push(await getDownloadURL(imageRef))
  }

  onProgress?.({
    stage: 'saving',
    fileIndex: files.length,
    fileCount: files.length,
    percent: 100,
  })

  return imageUrls
}

async function removeProductImages(imageUrls: string[]): Promise<void> {
  if (imageUrls.length === 0) {
    return
  }

  const storage = requireFirebaseStorage()
  const results = await Promise.allSettled(
    imageUrls.map((imageUrl) => deleteObject(ref(storage, imageUrl))),
  )
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} image(s) could not be removed from Firebase Storage.`,
    )
  }
}

function toFirestoreData(
  product: ProductWriteData,
  imageUrls: string[],
  createdAt?: Timestamp,
) {
  return {
    name: product.name.trim(),
    description: product.description.trim(),
    price: product.price,
    ...(product.compareAtPrice === undefined
      ? {}
      : { compareAtPrice: product.compareAtPrice }),
    stock: product.stock,
    category: product.category,
    status: product.status,
    images: imageUrls,
    sku: product.sku.trim(),
    tags: product.tags,
    ...(createdAt ? { createdAt } : { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  }
}

export async function createProduct(
  product: ProductWriteData,
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<void> {
  const products = collection(requireFirestore(), 'products')
  const newProductRef = doc(products)
  const uploadedImages: string[] = []
  const uploadedImagePaths: string[] = []

  try {
    uploadedImages.push(
      ...(await uploadProductImages(
        newProductRef.id,
        product.newImages,
        uploadedImagePaths,
        onProgress,
      )),
    )
    if (product.newImages.length === 0) {
      onProgress?.({
        stage: 'saving',
        fileIndex: 0,
        fileCount: 0,
        percent: 100,
      })
    }
    await setDoc(newProductRef, toFirestoreData(product, uploadedImages))
  } catch (error) {
    if (uploadedImagePaths.length > 0) {
      await removeProductImages(uploadedImagePaths).catch((cleanupError: unknown) => {
        console.error('Failed to clean up uploaded product images.', cleanupError)
      })
    }
    throw error
  }
}

export async function updateProduct(
  productId: string,
  product: ProductWriteData,
  createdAt: string,
  previousImageUrls: string[],
  onProgress?: (progress: ProductImageUploadProgress) => void,
): Promise<void> {
  const uploadedImagePaths: string[] = []
  let imageUrls: string[] = []
  const productRef = doc(requireFirestore(), 'products', productId)

  try {
    const uploadedImages = await uploadProductImages(
      productId,
      product.newImages,
      uploadedImagePaths,
      onProgress,
    )
    imageUrls = [...product.existingImages, ...uploadedImages]
    const data = toFirestoreData(
      product,
      imageUrls,
      Timestamp.fromDate(new Date(createdAt)),
    )
    if (product.newImages.length === 0) {
      onProgress?.({
        stage: 'saving',
        fileIndex: 0,
        fileCount: 0,
        percent: 100,
      })
    }
    await updateDoc(productRef, {
      ...data,
      compareAtPrice:
        product.compareAtPrice === undefined
          ? deleteField()
          : product.compareAtPrice,
    })
  } catch (error) {
    await cleanupUploadedImages(uploadedImagePaths)
    throw error
  }

  const removedImageUrls = previousImageUrls.filter(
    (imageUrl) => !imageUrls.includes(imageUrl),
  )
  try {
    await removeProductImages(removedImageUrls)
  } catch {
    throw new Error(
      `The product record was saved, but ${removedImageUrls.length} old image(s) could not be removed from Firebase Storage.`,
    )
  }
}

export async function deleteProduct(product: Product): Promise<void> {
  await deleteDoc(doc(requireFirestore(), 'products', product.id))
  try {
    await removeProductImages(product.images)
  } catch {
    throw new Error(
      `The product was deleted, but ${product.images.length} image(s) could not be removed from Firebase Storage.`,
    )
  }
}

async function cleanupUploadedImages(imagePaths: string[]): Promise<void> {
  if (imagePaths.length === 0) {
    return
  }

  try {
    await removeProductImages(imagePaths)
  } catch (cleanupError) {
    console.error('Failed to clean up uploaded product images.', cleanupError)
  }
}
