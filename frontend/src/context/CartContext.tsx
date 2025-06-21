import React, { createContext, useContext, useEffect, useState } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

interface CartContextState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextState | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart')
    return stored ? (JSON.parse(stored) as CartItem[]) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem: CartContextState['addItem'] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }

  const removeItem: CartContextState['removeItem'] = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity: CartContextState['updateQuantity'] = (id, quantity) => {
    if (quantity <= 0) return removeItem(id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
} 