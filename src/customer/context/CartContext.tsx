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

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
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

  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = useCallback((input: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === input.variant_id)
      if (existing) {
        if (existing.quantity >= input.max_stock) {
          toast.error(`Only ${input.max_stock} in stock`)
          return prev
        }
        return prev.map((i) =>
          i.variant_id === input.variant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      if (input.max_stock < 1) {
        toast.error('Out of stock')
        return prev
      }
      return [...prev, { ...input, quantity: 1 }]
    })
    setIsDrawerOpen(true)
  }, [])

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