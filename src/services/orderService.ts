import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { requireFirestore } from '../lib/firebase'
import type {
  Address,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from '../types/order'

const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Order data is invalid: ${field} must be text.`)
  }

  return value
}

function asDate(value: unknown, field: string): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString()
  }

  throw new Error(`Order data is invalid: ${field} is not a valid date.`)
}

function parseCustomer(value: unknown): Customer {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Order data is invalid: customer is missing.')
  }
  const customer = value as Record<string, unknown>

  return {
    id: asString(customer.id, 'customer.id'),
    name: asString(customer.name, 'customer.name'),
    email: asString(customer.email, 'customer.email'),
    ...(typeof customer.avatar === 'string' ? { avatar: customer.avatar } : {}),
  }
}

function parseAddress(value: unknown): Address {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Order data is invalid: shipping address is missing.')
  }
  const address = value as Record<string, unknown>

  return {
    street: asString(address.street, 'shippingAddress.street'),
    city: asString(address.city, 'shippingAddress.city'),
    state: asString(address.state, 'shippingAddress.state'),
    zipCode: asString(address.zipCode, 'shippingAddress.zipCode'),
    country: asString(address.country, 'shippingAddress.country'),
  }
}

function parseItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    throw new Error('Order data is invalid: items must be a list.')
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Order item ${index + 1} is invalid.`)
    }
    const orderItem = item as Record<string, unknown>
    const quantity = orderItem.quantity
    const price = orderItem.price
    const total = orderItem.total

    if (
      typeof quantity !== 'number' ||
      typeof price !== 'number' ||
      typeof total !== 'number'
    ) {
      throw new Error(`Order item ${index + 1} has invalid price or quantity.`)
    }

    return {
      productId: asString(orderItem.productId, `items[${index}].productId`),
      productName: asString(
        orderItem.productName,
        `items[${index}].productName`,
      ),
      productImage:
        typeof orderItem.productImage === 'string' ? orderItem.productImage : '',
      quantity,
      price,
      total,
    }
  })
}

function parseOrder(id: string, value: Record<string, unknown>): Order {
  const status = value.status
  const paymentStatus = value.paymentStatus
  const paymentStatuses: PaymentStatus[] = ['paid', 'unpaid', 'refunded']

  if (typeof status !== 'string' || !orderStatuses.includes(status as OrderStatus)) {
    throw new Error(`Order "${id}" has an unsupported status.`)
  }
  if (
    typeof paymentStatus !== 'string' ||
    !paymentStatuses.includes(paymentStatus as PaymentStatus)
  ) {
    throw new Error(`Order "${id}" has an unsupported payment status.`)
  }
  if (typeof value.totalAmount !== 'number') {
    throw new Error(`Order "${id}" has an invalid total amount.`)
  }

  return {
    id,
    orderNumber: asString(value.orderNumber, 'orderNumber'),
    customer: parseCustomer(value.customer),
    items: parseItems(value.items),
    status: status as OrderStatus,
    totalAmount: value.totalAmount,
    shippingAddress: parseAddress(value.shippingAddress),
    paymentMethod: asString(value.paymentMethod, 'paymentMethod'),
    paymentStatus: paymentStatus as PaymentStatus,
    createdAt: asDate(value.createdAt, 'createdAt'),
    updatedAt: asDate(value.updatedAt, 'updatedAt'),
  }
}

export async function getOrders(): Promise<Order[]> {
  const ordersQuery = query(
    collection(requireFirestore(), 'orders'),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(ordersQuery)

  return snapshot.docs.map((orderDoc) =>
    parseOrder(orderDoc.id, orderDoc.data()),
  )
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await updateDoc(doc(requireFirestore(), 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
  })
}
