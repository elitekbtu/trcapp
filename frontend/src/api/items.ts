import api from './client'

// Shared base properties for an Item
interface ItemBase {
  name: string
  brand?: string
  color?: string
  image_url?: string
  description?: string
  price?: number
  category?: string
  article?: string
  size?: string
  style?: string
  collection?: string
}

export interface ItemCreate extends ItemBase {}
export interface ItemUpdate extends Partial<ItemBase> {}
export interface ItemOut extends ItemBase {
  id: number
  created_at?: string
  updated_at?: string
}

export interface ListItemsParams {
  skip?: number
  limit?: number
  q?: string
  category?: string
  style?: string
  collection?: string
  min_price?: number
  max_price?: number
  size?: string
  sort_by?: string
}

export const listItems = async (params: ListItemsParams = {}) => {
  const resp = await api.get<ItemOut[]>('/api/items/', { params })
  return resp.data
}

export const getItem = async (id: number) => {
  const resp = await api.get<ItemOut>(`/api/items/${id}`)
  return resp.data
}

export const createItem = async (data: ItemCreate) => {
  const resp = await api.post<ItemOut>('/api/items/', data)
  return resp.data
}

export const updateItem = async (id: number, data: ItemUpdate) => {
  const resp = await api.put<ItemOut>(`/api/items/${id}`, data)
  return resp.data
}

export const deleteItem = async (id: number) => {
  await api.delete(`/api/items/${id}`)
}

export const trendingItems = async (limit?: number) => {
  const resp = await api.get<ItemOut[]>('/api/items/trending', { params: { limit } })
  return resp.data
}

export const similarItems = async (id: number, limit?: number) => {
  const resp = await api.get<ItemOut[]>(`/api/items/${id}/similar`, { params: { limit } })
  return resp.data
}

export const itemsByCollection = async (name: string) => {
  const resp = await api.get<ItemOut[]>('/api/items/collections', { params: { name } })
  return resp.data
}

// ---------- Favorites ----------

export const toggleFavoriteItem = async (id: number) => {
  const resp = await api.post<{ favorited: boolean }>(`/api/items/${id}/favorite`, {})
  return resp.data
}

export const listFavoriteItems = async () => {
  const resp = await api.get<ItemOut[]>('/api/items/favorites')
  return resp.data
}

// ---------- View History ----------

export const viewHistoryItems = async (limit = 50) => {
  const resp = await api.get<ItemOut[]>('/api/items/history', { params: { limit } })
  return resp.data
}

export const clearHistoryItems = async () => {
  await api.delete('/api/items/history')
}

// ---------- Comments ----------

export interface CommentCreate {
  content: string
  rating?: number
}

export interface CommentOut extends CommentCreate {
  id: number
  user_id: number
  created_at: string
  likes: number
}

export const listItemComments = async (itemId: number) => {
  const resp = await api.get<CommentOut[]>(`/api/items/${itemId}/comments`)
  return resp.data
}

export const addItemComment = async (itemId: number, data: CommentCreate) => {
  const resp = await api.post<CommentOut>(`/api/items/${itemId}/comments`, data)
  return resp.data
}

export const likeItemComment = async (itemId: number, commentId: number) => {
  const resp = await api.post<{ liked: boolean }>(`/api/items/${itemId}/comments/${commentId}/like`, {})
  return resp.data
}

// ---------- Delete Comment ----------

export const deleteItemComment = async (itemId: number, commentId: number) => {
  await api.delete(`/api/items/${itemId}/comments/${commentId}`)
} 