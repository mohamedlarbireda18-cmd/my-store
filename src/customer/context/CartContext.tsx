import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  type CartItem,
  loadCart,
  saveCart,
  clearCartStorage,
} from '../utils/cartStorage'
import toast from 'react-hot-toast'
import { useLanguage } from '../../i18n/LanguageContext'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (variantId: string, quantity: number) => void
  removeItem: (variantId: string) => void
  clearCart: () => void
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = useCallback(
    (input: Omit<CartItem, 'quantity'>, requestedQuantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variant_id === input.variant_id)
        if (existing) {
          if (existing.quantity >= input.max_stock) {
            toast.error(t('cart.onlyInStock', { count: input.max_stock }))
            return prev
          }
          const nextQuantity = Math.min(
            existing.quantity + Math.max(1, requestedQuantity),
            input.max_stock
          )
          return prev.map((i) =>
            i.variant_id === input.variant_id
              ? { ...i, quantity: nextQuantity }
              : i
          )
        }
        if (input.max_stock < 1) {
          toast.error(t('cart.outOfStock'))
          return prev
        }
        return [
          ...prev,
          {
            ...input,
            quantity: Math.min(
              Math.max(1, requestedQuantity),
              input.max_stock
            ),
          },
        ]
      })
      setIsDrawerOpen(true)
    },
    [t]
  )

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      const item = items.find((entry) => entry.variant_id === variantId)
      if (!item) return

      if (quantity > item.max_stock) {
        toast.error(t('cart.onlyInStock', { count: item.max_stock }))
      }

      const nextQuantity = Math.max(1, Math.min(quantity, item.max_stock))
      setItems((prev) =>
        prev.map((entry) =>
          entry.variant_id === variantId
            ? { ...entry, quantity: nextQuantity }
            : entry
        )
      )
    },
    [items, t]
  )

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    clearCartStorage()
  }, [])

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}