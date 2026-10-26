import { Download, FileText, Plus, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ProductForm } from '../components/products/ProductForm'
import { ProductTable } from '../components/products/ProductTable'
import { TableSkeleton } from '../components/ui/TableSkeleton'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type ProductImageUploadProgress,
  type ProductWriteData,
} from '../services/productService'
import { useAuthStore } from '../store/authStore'
import type {
  Product,
  ProductCategory,
  ProductStatus,
} from '../types/product'
import type { ProductFilterCriteria } from '../utils/productFilters'
import { filterProducts } from '../utils/productFilters'

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

export default function ProductsPage() {
  const user = useAuthStore((state) => state.user)
  const canManage = user?.role === 'admin' || user?.role === 'editor'
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] =
    useState<ProductImageUploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [status, setStatus] = useState<ProductStatus | 'all'>('all')
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(searchInput.trim().toLowerCase())

  const loadProducts = useCallback(async (refresh = false) => {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      setProducts(await getProducts())
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load products from Firebase.'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadProducts(), 0)
    return () => window.clearTimeout(timerId)
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    const filters: ProductFilterCriteria = {
      search: debouncedSearch,
      category,
      status,
      minPrice: minPriceInput === '' ? null : Number(minPriceInput),
      maxPrice: maxPriceInput === '' ? null : Number(maxPriceInput),
    }

    return filterProducts(products, filters)
  }, [category, debouncedSearch, maxPriceInput, minPriceInput, products, status])

  async function handleSave(data: ProductWriteData) {
    setIsSaving(true)
    setUploadProgress(null)

    try {
      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          data,
          editingProduct.createdAt,
          editingProduct.images,
          setUploadProgress,
        )
        toast.success('Product updated.')
      } else {
        await createProduct(data, setUploadProgress)
        toast.success('Product created.')
      }

      setIsFormOpen(false)
      setEditingProduct(null)
      await loadProducts(true)
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save this product.'
      toast.error(message)

      if (message.includes('The product record was saved')) {
        setIsFormOpen(false)
        setEditingProduct(null)
        await loadProducts(true)
      }
    } finally {
      setIsSaving(false)
      setUploadProgress(null)
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteProduct(product)
      toast.success('Product deleted.')
      await loadProducts(true)
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete this product.'
      toast.error(message)
      if (message.includes('The product was deleted')) {
        await loadProducts(true)
      }
    }
  }

  function openCreateForm() {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!isSaving) {
      setIsFormOpen(false)
      setEditingProduct(null)
    }
  }

  function exportProductRows(format: 'csv' | 'pdf') {
    const headers = [
      'Name',
      'SKU',
      'Category',
      'Price',
      'Compare-at price',
      'Stock',
      'Status',
      'Tags',
      'Created',
    ]
    const rows = filteredProducts.map((product) => [
      product.name,
      product.sku,
      product.category,
      product.price.toFixed(2),
      product.compareAtPrice?.toFixed(2) ?? '',
      product.stock,
      product.status,
      product.tags.join(', '),
      new Date(product.createdAt).toLocaleDateString(),
    ])
    const dateSuffix = new Date().toISOString().slice(0, 10)

    void import('../utils/export')
      .then(({ exportToCsv, exportToPdf }) => {
        if (format === 'csv') {
          exportToCsv(`products-${dateSuffix}.csv`, headers, rows)
        } else {
          exportToPdf('Products', `products-${dateSuffix}.pdf`, headers, rows)
        }
        toast.success(`Exported ${rows.length} products.`)
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to export products.',
        )
      })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your catalog, inventory, and product visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading || filteredProducts.length === 0}
            aria-label="Export products to CSV"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => exportProductRows('csv')}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            type="button"
            disabled={isLoading || filteredProducts.length === 0}
            aria-label="Export products to PDF"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => exportProductRows('pdf')}
          >
            <FileText className="size-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            type="button"
            disabled={isRefreshing || isLoading}
            aria-label="Refresh products"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => void loadProducts(true)}
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {canManage && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={openCreateForm}
            >
              <Plus className="size-4" />
              Add product
            </button>
          )}
        </div>
      </header>

      <section
        aria-label="Product filters"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-5"
      >
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search products</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchInput}
            type="search"
            placeholder="Search products..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              onClick={() => setSearchInput('')}
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <label>
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | 'all')
            }
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) =>
              setStatus(event.target.value as ProductStatus | 'all')
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Minimum price</span>
          <input
            value={minPriceInput}
            type="number"
            min="0"
            step="0.01"
            placeholder="Min price"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => setMinPriceInput(event.target.value)}
          />
        </label>

        <label>
          <span className="sr-only">Maximum price</span>
          <input
            value={maxPriceInput}
            type="number"
            min="0"
            step="0.01"
            placeholder="Max price"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => setMaxPriceInput(event.target.value)}
          />
        </label>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            className="shrink-0 font-semibold underline"
            onClick={() => void loadProducts(true)}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={8} />
      ) : (
        <ProductTable
          products={filteredProducts}
          canManage={canManage}
          onEdit={openEditForm}
          onDelete={(product) => void handleDelete(product)}
        />
      )}

      {!canManage && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your account has read-only product access.
        </p>
      )}

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          isSaving={isSaving}
          uploadProgress={uploadProgress}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      )}
    </div>
  )
}
