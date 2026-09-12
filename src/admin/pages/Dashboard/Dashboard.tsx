import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  ShoppingCart,
  Package,
  Tags,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  ShoppingBag,
  FolderPlus,
  Truck,
} from 'lucide-react'
import {
  useDashboardStats,
  useSalesOverview,
  useOrdersByCategory,
  useRecentOrders,
  useRecentActivity,
  type SalesRange,
} from '../../../hooks/useDashboard'
import {
  formatPrice,
  formatDate,
  orderStatusLabel,
  orderStatusVariant,
} from '../../../utils/format'
import { timeAgo } from '../../../utils/timeAgo'
import './Dashboard.css'

// Distinct donut palette — no two colors are close
const DONUT_COLORS = [
  '#00b274', // green
  '#facc15', // yellow
  '#a855f7', // mauve / purple
  '#f97316', // orange
  '#ec4899', // pink
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#8b5cf6', // violet
]

const CHART_LINE = '#22c55e'

const RANGE_OPTIONS: { key: SalesRange; label: string; axisInterval: number }[] = [
  { key: '7d', label: 'Last 7 days', axisInterval: 0 },
  { key: '30d', label: 'Last 30 days', axisInterval: 4 },
  { key: '1y', label: 'Last year', axisInterval: 0 },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [range, setRange] = useState<SalesRange>('7d')

  const { data: stats } = useDashboardStats()
  const { data: sales = [] } = useSalesOverview(range)
  const { data: ordersByCategory = [] } = useOrdersByCategory()
  const { data: recentOrders = [] } = useRecentOrders(5)
  const { data: activity = [] } = useRecentActivity(6)

  const greeting = getGreeting()
  const currentRange = RANGE_OPTIONS.find((o) => o.key === range)!

  return (
    <div className="dashboard">
      {/* ==============================
          Header
      ============================== */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__greeting">
            {greeting}, Admin <span className="dashboard__wave">👋</span>
          </h1>
          <p className="dashboard__subtitle">
            Here's what's happening with your store today.
          </p>
        </div>

        <div className="dashboard__range-group">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`dashboard__range-btn ${
                range === opt.key ? 'dashboard__range-btn--active' : ''
              }`}
              onClick={() => setRange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==============================
          Stat cards
      ============================== */}
      <div className="dashboard__stats">
        <StatCard
          icon={<ShoppingCart size={20} />}
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          color="indigo"
        />
        <StatCard
          icon={<Package size={20} />}
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          color="green"
        />
        <StatCard
          icon={<Tags size={20} />}
          label="Total Categories"
          value={stats?.totalCategories ?? 0}
          color="orange"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Total Customers"
          value={stats?.totalCustomers ?? 0}
          color="purple"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Total Revenue"
          value={formatPrice(stats?.totalRevenue ?? 0)}
          color="pink"
        />
      </div>

      {/* ==============================
          Charts row
      ============================== */}
      <div className="dashboard__charts">
        {/* Sales overview */}
        <div className="admin-card dashboard__card dashboard__card--chart">
          <div className="dashboard__card-header">
            <div>
              <h2 className="dashboard__card-title">Sales Overview</h2>
              <p className="dashboard__card-subtitle">
                Revenue over the {currentRange.label.toLowerCase()}
              </p>
            </div>
            <div className="dashboard__card-icon dashboard__card-icon--indigo">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="dashboard__chart-area">
            {sales.length === 0 ? (
              <div className="dashboard__chart-empty">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sales}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={CHART_LINE}
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_LINE}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={currentRange.axisInterval}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                    }}
                    formatter={(value) => [
                      formatPrice(Number(value ?? 0)),
                      'Revenue',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_LINE}
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    dot={{ r: 3, fill: CHART_LINE, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders by category */}
        <div className="admin-card dashboard__card dashboard__card--chart">
          <div className="dashboard__card-header">
            <div>
              <h2 className="dashboard__card-title">Orders by Category</h2>
              <p className="dashboard__card-subtitle">
                Which categories sell the most
              </p>
            </div>
          </div>
          <div className="dashboard__chart-area dashboard__chart-area--donut">
            {ordersByCategory.length === 0 ? (
              <div className="dashboard__chart-empty">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByCategory}
                    dataKey="count"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {ordersByCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      `${Number(value ?? 0)} units`,
                      String(name ?? ''),
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card dashboard__card dashboard__card--actions">
          <div className="dashboard__card-header">
            <h2 className="dashboard__card-title">Quick Actions</h2>
          </div>
          <div className="dashboard__actions">
            <QuickAction
              icon={<Plus size={16} />}
              label="Add Product"
              onClick={() => navigate('/admin/products/new')}
            />
            <QuickAction
              icon={<FolderPlus size={16} />}
              label="Add Category"
              onClick={() => navigate('/admin/categories')}
            />
            <QuickAction
              icon={<ShoppingBag size={16} />}
              label="Manage Orders"
              onClick={() => navigate('/admin/orders')}
            />
            <QuickAction
              icon={<Truck size={16} />}
              label="Delivery Settings"
              onClick={() => navigate('/admin/delivery')}
            />
          </div>
        </div>
      </div>

      {/* ==============================
          Recent Orders
      ============================== */}
      <div className="admin-card dashboard__card">
        <div className="dashboard__card-header">
          <div>
            <h2 className="dashboard__card-title">Recent Orders</h2>
            <p className="dashboard__card-subtitle">
              The latest orders received
            </p>
          </div>
          <button
            className="dashboard__view-all"
            onClick={() => navigate('/admin/orders')}
          >
            View all
            <ArrowRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="dashboard__empty-block">
            <ShoppingCart size={32} />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="dashboard__table-wrap">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <td className="dashboard__order-id">
                      {order.order_number}
                    </td>
                    <td>{order.customer_name}</td>
                    <td className="dashboard__muted">
                      {order.items_count} item
                      {order.items_count > 1 ? 's' : ''}
                    </td>
                    <td className="dashboard__amount">
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
                    <td className="dashboard__muted">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==============================
          Recent Activity
      ============================== */}
      <div className="admin-card dashboard__card">
        <div className="dashboard__card-header">
          <h2 className="dashboard__card-title">Recent Activity</h2>
        </div>

        {activity.length === 0 ? (
          <div className="dashboard__empty-block">
            <p>No activity yet</p>
          </div>
        ) : (
          <ul className="dashboard__activity">
            {activity.map((item) => (
              <li key={item.id} className="dashboard__activity-item">
                <div
                  className={`dashboard__activity-icon dashboard__activity-icon--${item.type}`}
                >
                  {item.type === 'order' && <ShoppingCart size={14} />}
                  {item.type === 'product' && <Package size={14} />}
                  {item.type === 'category' && <Tags size={14} />}
                </div>
                <div className="dashboard__activity-body">
                  <div className="dashboard__activity-title">{item.title}</div>
                  <div className="dashboard__activity-desc">
                    {item.description}
                  </div>
                </div>
                <div className="dashboard__activity-time">
                  {timeAgo(item.timestamp)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'indigo' | 'green' | 'orange' | 'purple' | 'pink'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="dashboard__stat">
      <div className={`dashboard__stat-icon dashboard__stat-icon--${color}`}>
        {icon}
      </div>
      <div className="dashboard__stat-content">
        <div className="dashboard__stat-label">{label}</div>
        <div className="dashboard__stat-value">{value}</div>
      </div>
    </div>
  )
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <button className="dashboard__action" onClick={onClick}>
      <span className="dashboard__action-icon">{icon}</span>
      <span className="dashboard__action-label">{label}</span>
      <ArrowRight size={14} className="dashboard__action-arrow" />
    </button>
  )
}

// ============================================
// Helpers
// ============================================
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}