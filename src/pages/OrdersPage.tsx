import { Download, Eye, FileText, RefreshCw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { TableSkeleton } from '../components/ui/TableSkeleton'
import { getOrders, updateOrderStatus } from '../services/orderService'
import type {
  Address,
  Order,
  OrderStatus,
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

const statusClasses: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  processing: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  refunded: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user)
  const canUpdateOrders = user?.role === 'admin' || user?.role === 'editor'
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (refresh = false) => {
    setError(null)
    if (refresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      setOrders(await getOrders())
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load orders from Firestore.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadOrders(), 0)
    return () => window.clearTimeout(timerId)
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          order.paymentMethod,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return (
        matchesSearch &&
        (statusFilter === 'all' || order.status === statusFilter)
      )
    })
  }, [orders, search, statusFilter])

  function exportOrderRows(format: 'csv' | 'pdf') {
    const headers = [
      'Order',
      'Customer',
      'Email',
      'Date',
      'Total',
      'Payment method',
      'Payment status',
      'Status',
    ]
    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      new Date(order.createdAt).toLocaleDateString(),
      order.totalAmount.toFixed(2),
      order.paymentMethod,
      order.paymentStatus,
      order.status,
    ])
    const dateSuffix = new Date().toISOString().slice(0, 10)

    void import('../utils/export')
      .then(({ exportToCsv, exportToPdf }) => {
        if (format === 'csv') {
          exportToCsv(`orders-${dateSuffix}.csv`, headers, rows)
        } else {
          exportToPdf('Orders', `orders-${dateSuffix}.pdf`, headers, rows)
        }
        toast.success(`Exported ${rows.length} orders.`)
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to export orders.',
        )
      })
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) {
      return
    }

    setUpdatingOrderId(order.id)
    try {
      await updateOrderStatus(order.id, status)
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      )
      setSelectedOrder((current) =>
        current?.id === order.id ? { ...current, status } : current,
      )
      toast.success(`Order ${order.orderNumber} updated.`)
    } catch (updateError) {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this order.',
      )
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const pendingCount = orders.filter((order) => order.status === 'pending').length
  const processingCount = orders.filter(
    (order) => order.status === 'processing',
  ).length
  const deliveredCount = orders.filter(
    (order) => order.status === 'delivered',
  ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review customer orders and keep fulfillment status up to date.
          </p>
        </div>
        <button
          type="button"
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          onClick={() => void loadOrders(true)}
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || filteredOrders.length === 0}
            aria-label="Export orders to CSV"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => exportOrderRows('csv')}
          >
            <Download className="size-4" />
            CSV
          </button>
          <button
            type="button"
            disabled={loading || filteredOrders.length === 0}
            aria-label="Export orders to PDF"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => exportOrderRows('pdf')}
          >
            <FileText className="size-4" />
            PDF
          </button>
        </div>
      </header>

      <section
        aria-label="Order summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <SummaryCard label="Total orders" value={orders.length} />
        <SummaryCard label="Pending" value={pendingCount} />
        <SummaryCard
          label="Processing / delivered"
          value={`${processingCount} / ${deliveredCount}`}
        />
      </section>

      <section
        aria-label="Order filters"
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"
      >
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            type="search"
            placeholder="Search order number or customer..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter by order status</span>
          <select
            value={statusFilter}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) =>
              setStatusFilter(event.target.value as OrderStatus | 'all')
            }
          >
            <option value="all">All statuses</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {capitalize(status)}
              </option>
            ))}
          </select>
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
            onClick={() => void loadOrders(true)}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={7} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {order.customer.email}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div>{capitalize(order.paymentStatus)}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {canUpdateOrders ? (
                        <label>
                          <span className="sr-only">
                            Update status for {order.orderNumber}
                          </span>
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${statusClasses[order.status]}`}
                            onChange={(event) =>
                              void changeStatus(
                                order,
                                event.target.value as OrderStatus,
                              )
                            }
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {capitalize(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[order.status]}`}
                        >
                          {capitalize(order.status)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <button
                        type="button"
                        aria-label={`View ${order.orderNumber}`}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      {orders.length === 0
                        ? 'No Firestore orders yet. Orders will appear here when created.'
                        : 'No orders match your search and filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          canUpdateOrders={canUpdateOrders}
          isUpdating={updatingOrderId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) =>
            void changeStatus(selectedOrder, status)
          }
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  )
}

function OrderDetails({
  order,
  canUpdateOrders,
  isUpdating,
  onClose,
  onStatusChange,
}: {
  order: Order
  canUpdateOrders: boolean
  isUpdating: boolean
  onClose: () => void
  onStatusChange: (status: OrderStatus) => void
}) {
  const address: Address = order.shippingAddress

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="order-details-title" className="text-lg font-semibold">
              Order {order.orderNumber}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close order details"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Customer</h3>
              <p className="mt-2 text-sm">{order.customer.name}</p>
              <p className="text-sm text-slate-500">{order.customer.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Shipping address</h3>
              <address className="mt-2 text-sm not-italic text-slate-500">
                {address.street}
                <br />
                {address.city}, {address.state} {address.zipCode}
                <br />
                {address.country}
              </address>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Items</h3>
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium">${item.total.toFixed(2)}</span>
                </li>
              ))}
              {order.items.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-500">
                  No item details were recorded for this order.
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="text-sm text-slate-500">
              {order.paymentMethod} · {capitalize(order.paymentStatus)}
            </div>
            <div className="text-lg font-bold">
              Total ${order.totalAmount.toFixed(2)}
            </div>
          </div>

          {canUpdateOrders && (
            <label className="block space-y-1.5 text-sm font-medium">
              <span>Order status</span>
              <select
                value={order.status}
                disabled={isUpdating}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                onChange={(event) =>
                  onStatusChange(event.target.value as OrderStatus)
                }
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {capitalize(status)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>
    </div>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
