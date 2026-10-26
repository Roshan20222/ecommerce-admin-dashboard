export type ProductCategory =
  | 'electronics'
  | 'clothing'
  | 'furniture'
  | 'books'
  | 'sports'
  | 'beauty'
  | 'food'
  | 'other'

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  stock: number
  category: ProductCategory
  status: ProductStatus
  images: string[]
  sku: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductFormData extends Omit<Product, 'images'> {
  images: File[]
}

export interface ProductFilters {
  search: string
  category: ProductCategory | 'all'
  status: ProductStatus | 'all'
  minPrice: number
  maxPrice: number
  sortBy: 'name' | 'price' | 'stock' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}
