import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'

// ============================================
// TYPES
// ============================================
export interface DashboardStats {
  totalOrders: number
  totalProducts: number
  totalCategories: number
  totalCustomers: number
  totalRevenue: number
}

export interface SalesPoint {
  date: string         // ISO date (yyyy-mm-dd)
  label: string        // short label (e.g. "Mon", "12 Sep")
  revenue: number
  orders: number
}

export interface CategorySlice {
  categoryId: string | null
  categoryName: string
  count: number
}

export interface RecentOrder extends Order {
  items_count: number
}

export interface ActivityItem {
  id: string
  type: 'order' | 'product' | 'category'
  title: string
  description: string
  timestamp: string
}

// ============================================
// STATS
// ============================================
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch counts in parallel
      const [ordersRes, productsRes, categoriesRes, customersRes, revenueRes] =
        await Promise.all([
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('customer_phone'),
          supabase
            .from('orders')
            .select('total')
            .neq('status', 'CANCELLED'),
        ])

      // Unique customers by phone
      const phones = new Set(
        (customersRes.data ?? [])
          .map((o: { customer_phone: string }) => o.customer_phone)
          .filter(Boolean)
      )

      // Total revenue (exclude cancelled)
      const revenue = (revenueRes.data ?? []).reduce(
        (sum: number, o: { total: number }) => sum + Number(o.total || 0),
        0
      )

      return {
        totalOrders: ordersRes.count ?? 0,
        totalProducts: productsRes.count ?? 0,
        totalCategories: categoriesRes.count ?? 0,
        totalCustomers: phones.size,
        totalRevenue: revenue,
      }
    },
  })
}

// ============================================
// SALES OVERVIEW (last N days)
// ============================================
export function useSalesOverview(days: number = 7) {
  return useQuery({
    queryKey: ['dashboard', 'sales', days],
    queryFn: async (): Promise<SalesPoint[]> => {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - (days - 1))

      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at, status')
        .gte('created_at', from.toISOString())
        .neq('status', 'CANCELLED')

      if (error) throw error

      // Build a map of date → { revenue, orders }
      const map = new Map<string, { revenue: number; orders: number }>()

      // Initialize all days
      for (let i = 0; i < days; i++) {
        const d = new Date(from)
        d.setDate(from.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        map.set(key, { revenue: 0, orders: 0 })
      }

      // Fill with actual orders
      for (const order of data ?? []) {
        const key = new Date(order.created_at).toISOString().slice(0, 10)
        const current = map.get(key)
        if (current) {
          current.revenue += Number(order.total || 0)
          current.orders += 1
        }
      }

      // Convert to array
      const result: SalesPoint[] = []
      for (const [date, value] of map.entries()) {
        const d = new Date(date)
        const label = d.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
        })
        result.push({
          date,
          label,
          revenue: Math.round(value.revenue * 100) / 100,
          orders: value.orders,
        })
      }

      return result
    },
  })
}

// ============================================
// ORDERS BY CATEGORY
// ============================================
export function useOrdersByCategory() {
  return useQuery({
    queryKey: ['dashboard', 'orders-by-category'],
    queryFn: async (): Promise<CategorySlice[]> => {
      // Fetch order items joined with product → category
      const { data, error } = await supabase.from('order_items').select(`
        quantity,
        product:products(
          category_id,
          category:categories(id, name)
        )
      `)

      if (error) throw error

      // Aggregate
      const agg = new Map<
        string | null,
        { name: string; count: number }
      >()

      for (const row of (data ?? []) as any[]) {
        const categoryId = row.product?.category_id ?? null
        const categoryName = row.product?.category?.name ?? 'Uncategorized'
        const current = agg.get(categoryId)
        if (current) {
          current.count += Number(row.quantity)
        } else {
          agg.set(categoryId, { name: categoryName, count: Number(row.quantity) })
        }
      }

      return Array.from(agg.entries()).map(([categoryId, value]) => ({
        categoryId,
        categoryName: value.name,
        count: value.count,
      }))
    },
  })
}

// ============================================
// RECENT ORDERS
// ============================================
export function useRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders', limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data ?? []).map((row: any) => ({
        ...row,
        items_count: row.order_items?.length ?? 0,
        order_items: undefined,
      })) as RecentOrder[]
    },
  })
}

// ============================================
// RECENT ACTIVITY
// ============================================
export function useRecentActivity(limit: number = 5) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      // Fetch recent orders, products, and categories in parallel
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, customer_name, created_at, total')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('products')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('categories')
          .select('id, name, updated_at')
          .order('updated_at', { ascending: false })
          .limit(limit),
      ])

      const items: ActivityItem[] = []

      for (const o of ordersRes.data ?? []) {
        items.push({
          id: `order-${o.id}`,
          type: 'order',
          title: `New order ${o.order_number}`,
          description: `${o.customer_name} · ${Number(o.total).toLocaleString()} DZD`,
          timestamp: o.created_at,
        })
      }

      for (const p of productsRes.data ?? []) {
        items.push({
          id: `product-${p.id}`,
          type: 'product',
          title: `Product added: ${p.name}`,
          description: 'A new product was created',
          timestamp: p.created_at,
        })
      }

      for (const c of categoriesRes.data ?? []) {
        items.push({
          id: `category-${c.id}`,
          type: 'category',
          title: `Category updated: ${c.name}`,
          description: 'A category was modified',
          timestamp: c.updated_at,
        })
      }

      // Sort by timestamp desc, take top N
      return items
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit)
    },
  })
}