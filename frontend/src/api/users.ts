import api from './client'

export interface User {
  id: number
  email: string
  is_admin?: boolean
  is_active?: boolean
}

export interface UserCreateAdmin {
  email: string
  password: string
  is_admin?: boolean
  is_active?: boolean
}

export interface UserUpdateAdmin {
  email?: string
  password?: string
  is_admin?: boolean
  is_active?: boolean
}

export const listUsers = async () => {
  const resp = await api.get<User[]>('/api/users/')
  return resp.data
}

export const createUser = async (data: UserCreateAdmin) => {
  const resp = await api.post<User>('/api/users/', data)
  return resp.data
}

export const getUser = async (id: number) => {
  const resp = await api.get<User>(`/api/users/${id}`)
  return resp.data
}

export const updateUser = async (id: number, data: UserUpdateAdmin) => {
  const resp = await api.patch<User>(`/api/users/${id}`, data)
  return resp.data
}

export const deleteUser = async (id: number) => {
  await api.delete(`/api/users/${id}`)
}

// User-specific content
export const listUserOutfits = async (userId: number) => {
  const resp = await api.get('/api/users/' + userId + '/outfits')
  return resp.data
}

export const toggleFavorite = async (userId: number, itemId: number) => {
  await api.post(`/api/users/${userId}/favorites/${itemId}`)
}

export const listFavorites = async (userId: number) => {
  const resp = await api.get(`/api/users/${userId}/favorites`)
  return resp.data
}

export const userHistory = async (userId: number, limit?: number) => {
  const resp = await api.get(`/api/users/${userId}/history`, { params: { limit } })
  return resp.data
} 