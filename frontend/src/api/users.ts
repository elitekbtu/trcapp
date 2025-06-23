import api from './client'
import {
  type ItemOut,
  type OutfitOut,
  type UserCreateAdmin,
  type UserOut as User,
  type UserUpdateAdmin,
} from './schemas'

// ---------- Users Management ----------

export const listUsers = async (): Promise<User[]> => {
  const resp = await api.get<User[]>('/api/users/')
  return resp.data
}

export const getUser = async (userId: number): Promise<User> => {
  const resp = await api.get<User>(`/api/users/${userId}`)
  return resp.data
}

export const createUserAdmin = async (data: UserCreateAdmin): Promise<User> => {
  const resp = await api.post<User>('/api/users/', data)
  return resp.data
}

export const updateUserAdmin = async (userId: number, data: UserUpdateAdmin): Promise<User> => {
  const resp = await api.patch<User>(`/api/users/${userId}`, data)
  return resp.data
}

export const deleteUser = async (userId: number): Promise<void> => {
  await api.delete(`/api/users/${userId}`)
}

// ---------- User Content ----------

export const listUserOutfits = async (userId: number) => {
  const resp = await api.get<OutfitOut[]>(`/api/users/${userId}/outfits`)
  return resp.data
}

export const toggleFavorite = async (userId: number, itemId: number) => {
  const resp = await api.post(`/api/users/${userId}/favorites/${itemId}`)
  return resp.data
}

export const listFavorites = async (userId: number): Promise<ItemOut[]> => {
  const resp = await api.get<ItemOut[]>(`/api/users/${userId}/favorites`)
  return resp.data
}

export const getUserHistory = async (userId: number, limit: number = 50): Promise<ItemOut[]> => {
  const resp = await api.get<ItemOut[]>(`/api/users/${userId}/history`, { params: { limit } })
  return resp.data
} 