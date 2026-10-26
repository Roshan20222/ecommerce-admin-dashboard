export interface Order {
  id: string
  orderNumber: string
  customer: Customer
  items: OrderItem[]
  status: OrderStatus
  totalAmount: number
  shippingAddress: Address
  paymentMethod: string
  paymentStatus: PaymentStatus
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  total: number
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'paid' | 'unpaid' | 'refunded'

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}
