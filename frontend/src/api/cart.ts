import api from './client'
import { type CartItemOut, type CartStateOut } from './schemas'

export const listCartItems = async () => {
  const resp = await api.get<CartItemOut[]>('/api/cart/')
  return resp.data
}

export const getCartState = async () => {
  const resp = await api.get<CartStateOut>('/api/cart/state')
  return resp.data
}

export const addToCart = async (itemId: number, quantity = 1) => {
  const resp = await api.post<CartStateOut>(`/api/cart/${itemId}`, null, {
    params: { qty: quantity },
  })
  return resp.data
}

export const updateCartItem = async (itemId: number, quantity: number) => {
  const resp = await api.put<CartStateOut>(`/api/cart/${itemId}`, { quantity })
  return resp.data
}

export const removeCartItem = async (itemId: number) => {
  await api.delete(`/api/cart/${itemId}`)
}

export const clearCart = async () => {
  await api.delete('/api/cart/')
} 