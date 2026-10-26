import { describe, expect, it } from 'vitest'
import { filterProducts } from './productFilters'
import type { Product } from '../types/product'

const products: Product[] = [
  {
    id: 'headphones',
    name: 'Studio Headphones',
    description: 'Wireless audio headphones',
    price: 120,
    compareAtPrice: 150,
    stock: 12,
    category: 'electronics',
    status: 'active',
    images: [],
    sku: 'AUD-120',
    tags: ['audio', 'sale'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'shirt',
    name: 'Cotton Shirt',
    description: 'Classic cotton shirt',
    price: 35,
    stock: 4,
    category: 'clothing',
    status: 'draft',
    images: [],
    sku: 'CLO-035',
    tags: ['cotton'],
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
]

const noFilters = {
  search: '',
  category: 'all' as const,
  status: 'all' as const,
  minPrice: null,
  maxPrice: null,
}

describe('filterProducts', () => {
  it('returns every product when no filters are active', () => {
    expect(filterProducts(products, noFilters)).toEqual(products)
  })

  it('searches product fields and tags without case sensitivity', () => {
    expect(
      filterProducts(products, { ...noFilters, search: '  AUDIO ' }).map(
        (product) => product.id,
      ),
    ).toEqual(['headphones'])
  })

  it('combines category, status, and inclusive price bounds', () => {
    const results = filterProducts(products, {
      ...noFilters,
      category: 'electronics',
      status: 'active',
      minPrice: 120,
      maxPrice: 120,
    })

    expect(results.map((product) => product.id)).toEqual(['headphones'])
  })

  it('returns no products when search does not match', () => {
    expect(
      filterProducts(products, { ...noFilters, search: 'nonexistent' }),
    ).toEqual([])
  })
})
