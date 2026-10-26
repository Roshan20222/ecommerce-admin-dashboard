import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  ClipboardList,
  Package,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardChartData, dashboardStats, recentOrders } from '../services/mockData'
import type { OrderStatus } from '../types/order'

const statCards = [
  {
    label: 'Total revenue',
    value: `$${dashboardStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    change: dashboardStats.revenueChange,
    icon: CircleDollarSign,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    label: 'Total orders',
    value: dashboardStats.totalOrders.toLocaleString(),
    change: dashboardStats.ordersChange,
    icon: ClipboardList,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    label: 'Total products',
    value: dashboardStats.totalProducts.toLocaleString(),
    change: dashboardStats.productsChange,
    icon: Package,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    label: 'Total customers',
    value: dashboardStats.totalUsers.toLocaleString(),
    change: dashboardStats.usersChange,
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  },
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

function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      <section
        aria-label="Store statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map(({ label, value, change, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold">{value}</p>
              </div>
              <span className={`rounded-lg p-2.5 ${color}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="font-semibold">{change}%</span>
              <span className="text-slate-500 dark:text-slate-400">
                vs last month
              </span>
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Revenue overview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Daily revenue for the last 7 days
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardChartData} margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `$${value / 1000}k`}
                />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Orders overview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Daily orders for the last 7 days
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardChartData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="orders" name="Orders" fill="#7c3aed" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold">Recent orders</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest activity from your store
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all
            <ArrowDownRight aria-hidden="true" className="ml-1 inline size-4 rotate-[-45deg]" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Order</th>
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="px-5 py-3 font-medium">Date</th>
                <th scope="col" className="px-5 py-3 font-medium">Amount</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-5 py-4 font-medium">{order.orderNumber}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div>{order.customer.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{order.customer.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
