export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  revenueChange: number
  ordersChange: number
  productsChange: number
  usersChange: number
}

export interface ChartData {
  date: string
  revenue: number
  orders: number
}
