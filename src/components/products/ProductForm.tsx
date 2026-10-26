import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isFirebaseStorageUploadsEnabled } from '../../lib/firebaseConfig'
import type { Product } from '../../types/product'
import type {
  ProductImageUploadProgress,
  ProductWriteData,
} from '../../services/productService'
import { ImageUpload } from './ImageUpload'

const productCategories = [
  'electronics',
  'clothing',
  'furniture',
  'books',
  'sports',
  'beauty',
  'food',
  'other',
] as const

const productSchema = z.object({
  name: z.string().trim().min(1, 'Enter a product name.').max(160),
  description: z.string().trim().max(10000),
  price: z.number().finite().min(0, 'Price cannot be negative.'),
  compareAtPrice: z.number().finite().min(0).optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative.'),
  category: z.enum(productCategories),
  status: z.enum(['active', 'draft', 'archived']),
  sku: z.string().trim().min(1, 'Enter a SKU.').max(80),
  tags: z.string(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product: Product | null
  isSaving: boolean
  uploadProgress: ProductImageUploadProgress | null
  onClose: () => void
  onSubmit: (data: ProductWriteData) => Promise<void>
}

export function ProductForm({
  product,
  isSaving,
  uploadProgress,
  onClose,
  onSubmit,
}: ProductFormProps) {
  const [newImages, setNewImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState(product?.images ?? [])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      compareAtPrice: product?.compareAtPrice,
      stock: product?.stock ?? 0,
      category: product?.category ?? 'other',
      status: product?.status ?? 'draft',
      sku: product?.sku ?? '',
      tags: product?.tags.join(', ') ?? '',
    },
  })

  async function submit(values: ProductFormValues) {
    await onSubmit({
      ...values,
      ...(values.compareAtPrice === undefined
        ? {}
        : { compareAtPrice: values.compareAtPrice }),
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
      newImages,
      existingImages,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <h2 id="product-form-title" className="text-lg font-semibold">
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button
            type="button"
            aria-label="Close form"
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>

        <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={errors.name?.message}>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="Wireless headphones"
              />
            </Field>
            <Field label="SKU" error={errors.sku?.message}>
              <input
                {...register('sku')}
                className={inputClass}
                placeholder="WH-100-BLK"
              />
            </Field>
            <Field label="Price" error={errors.price?.message}>
              <input
                {...register('price', { setValueAs: (value) => Number(value) })}
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
              />
            </Field>
            <Field label="Compare-at price" error={errors.compareAtPrice?.message}>
              <input
                {...register('compareAtPrice', {
                  setValueAs: (value) =>
                    value === '' ? undefined : Number(value),
                })}
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="Optional"
              />
            </Field>
            <Field label="Stock quantity" error={errors.stock?.message}>
              <input
                {...register('stock', { setValueAs: (value) => Number(value) })}
                type="number"
                min="0"
                step="1"
                className={inputClass}
              />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <select {...register('category')} className={inputClass}>
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category[0].toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Tags" error={errors.tags?.message}>
              <input
                {...register('tags')}
                className={inputClass}
                placeholder="sale, featured, summer"
              />
            </Field>
          </div>

          <Field label="Description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              className={inputClass}
              placeholder="Describe the product..."
            />
          </Field>

          <ImageUpload
            files={newImages}
            existingImages={existingImages}
            uploadsEnabled={isFirebaseStorageUploadsEnabled}
            onFilesChange={setNewImages}
            onExistingImagesChange={setExistingImages}
          />
          {isSaving && (
            <div
              className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
              role="status"
              aria-live="polite"
            >
              {uploadProgress ? (
                uploadProgress.stage === 'uploading' ? (
                  <>
                    <div className="mb-2 flex justify-between gap-3">
                      <span>
                        Uploading image {uploadProgress.fileIndex} of{' '}
                        {uploadProgress.fileCount}
                      </span>
                      <span>{uploadProgress.percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-[width]"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                  </>
                ) : (
                  'Uploading complete. Saving product to Firestore...'
                )
              ) : (
                'Saving product...'
              )}
            </div>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : product ? 'Save changes' : 'Create product'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  )
}
