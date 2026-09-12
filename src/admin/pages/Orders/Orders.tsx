import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Package,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  useOrders,
  useOrderStats,
  type OrderFilters,
} from '../../../hooks/useOrders'
import { useWilayas } from '../../../hooks/useWilayas'
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusVariant,
} from '../../../utils/format'
import type { OrderStatus } from '../../../types'
import './Orders.css'

const PAGE_SIZE = 10

export function Orders() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    wilayaId: 'all',
    search: '',
  })
  const [page, setPage] = useState(1)

  const { data: orders = [], isLoading, error } = useOrders(filters)
  const { data: stats } = useOrderStats()
  const { data: wilayas = [] } = useWilayas()

  // Reset page on filter change
  const updateFilter = <K extends keyof OrderFilters>(
    key: K,
    value: OrderFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const paginated = useMemo(
    () => orders.slice(startIndex, startIndex + PAGE_SIZE),
    [orders, startIndex]
  )

  // Wilaya lookup for table rendering
  const wilayaMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of wilayas) map.set(w.id, w.name)
    return map
  }, [wilayas])

  if (error) {
    return (
      <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--admin-red)' }}>
          Error loading orders: {(error as Error).message}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Orders</h1>
          <p className="admin-page-header__subtitle">
            Manage and track all customer orders.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="orders__stats">
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Total"
          value={stats?.total ?? 0}
          color="indigo"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending"
          value={stats?.pending ?? 0}
          color="orange"
        />
        <StatCard
          icon={<Package size={20} />}
          label="Accepted"
          value={stats?.accepted ?? 0}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Done"
          value={stats?.done ?? 0}
          color="green"
        />
        <StatCard
          icon={<XCircle size={20} />}
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          color="red"
        />
      </div>

      {/* Table Card */}
      <div className="admin-card orders__card">
        {/* Toolbar */}
        <div className="orders__toolbar">
          <select
            className="orders__select"
            value={filters.status}
            onChange={(e) =>
              updateFilter('status', e.target.value as OrderStatus | 'all')
            }
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED_PENDING">Accepted</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="orders__select"
            value={filters.wilayaId}
            onChange={(e) => updateFilter('wilayaId', e.target.value)}
          >
            <option value="all">All wilayas</option>
            {wilayas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>

          <div className="orders__search">
            <Search size={16} className="orders__search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, or order #"
              className="orders__search-input"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="orders__loading">Loading orders...</div>
        ) : paginated.length === 0 ? (
          <div className="orders__empty">
            <ShoppingCart size={40} className="orders__empty-icon" />
            <h3 className="orders__empty-title">No orders found</h3>
            <p className="orders__empty-desc">
              {filters.search ||
              filters.status !== 'all' ||
              filters.wilayaId !== 'all'
                ? 'Try adjusting your filters.'
                : 'Orders will appear here as customers place them.'}
            </p>
          </div>
        ) : (
          <div className="orders__table-wrap">
            <table className="orders__table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Wilaya</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="orders__order-id">
                        {order.order_number}
                      </span>
                    </td>
                    <td>
                      <div className="orders__customer-name">
                        {order.customer_name}
                      </div>
                    </td>
                    <td>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="orders__phone"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.customer_phone}
                      </a>
                    </td>
                    <td className="orders__muted">
                      {order.wilaya?.name ?? wilayaMap.get(order.wilaya_id) ?? '—'}
                    </td>
                    <td className="orders__muted">
                      {order.items_count} item
                      {order.items_count > 1 ? 's' : ''}
                    </td>
                    <td className="orders__amount">
                      {formatPrice(order.total)}
                    </td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${orderStatusVariant(
                          order.status
                        )}`}
                      >
                        <span className="admin-badge__dot" />
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="orders__muted">
                      {formatDate(order.created_at)}
                    </td>
                    <td>
                      <div className="orders__actions">
                        <button
                          className="orders__action-btn"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="orders__pagination">
            <span className="orders__pagination-info">
              Showing <strong>{startIndex + 1}</strong>–
              <strong>{Math.min(startIndex + PAGE_SIZE, orders.length)}</strong> of{' '}
              <strong>{orders.length}</strong> orders
            </span>
            <div className="orders__pagination-controls">
              <button
                className="orders__page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="orders__page-current">
                {page} / {totalPages}
              </span>
              <button
                className="orders__page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================
   Stat Card
   ============================================ */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'indigo' | 'orange' | 'blue' | 'green' | 'red'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="orders__stat">
      <div className={`orders__stat-icon orders__stat-icon--${color}`}>
        {icon}
      </div>
      <div className="orders__stat-content">
        <div className="orders__stat-label">{label}</div>
        <div className="orders__stat-value">{value}</div>
      </div>
    </div>
  )
}