import api from './client'
import type { ItemOut } from './items'

export interface CartItemOut {
  id: number
  quantity: number
  item: ItemOut
}

export const listCartItems = async () => {
  const resp = await api.get<CartItemOut[]>('/api/cart/')
  return resp.data
}

export const addToCart = async (itemId: number, quantity = 1) => {
  const resp = await api.post<CartItemOut>(`/api/cart/${itemId}`, {}, {
    params: { qty: quantity },
  })
  return resp.data
}

export const updateCartItem = async (itemId: number, quantity: number) => {
  const resp = await api.put<CartItemOut>(`/api/cart/${itemId}`, { quantity })
  return resp.data
}

export const removeCartItem = async (itemId: number) => {
  await api.delete(`/api/cart/${itemId}`)
}

export const clearCart = async () => {
  await api.delete('/api/cart/')
} 