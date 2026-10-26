import type {
  Product,
  ProductCategory,
  ProductStatus,
} from '../types/product'

export interface ProductFilterCriteria {
  search: string
  category: ProductCategory | 'all'
  status: ProductStatus | 'all'
  minPrice: number | null
  maxPrice: number | null
}

export function filterProducts(
  products: Product[],
  filters: ProductFilterCriteria,
): Product[] {
  const search = filters.search.trim().toLowerCase()

  return products.filter((product) => {
    const matchesSearch =
      search.length === 0 ||
      [
        product.name,
        product.description,
        product.sku,
        product.category,
        ...product.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    const matchesCategory =
      filters.category === 'all' || product.category === filters.category
    const matchesStatus =
      filters.status === 'all' || product.status === filters.status
    const matchesMinPrice =
      filters.minPrice === null || product.price >= filters.minPrice
    const matchesMaxPrice =
      filters.maxPrice === null || product.price <= filters.maxPrice

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesMinPrice &&
      matchesMaxPrice
    )
  })
}
