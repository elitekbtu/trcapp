import api from './client'
import { type ProfileOut, type ProfileUpdate } from './schemas'

// ---------- Profile Management ----------

export const getProfile = async (): Promise<ProfileOut> => {
  const resp = await api.get<ProfileOut>('/api/profile/')
  return resp.data
}

export const updateProfile = async (data: ProfileUpdate): Promise<ProfileOut> => {
  const resp = await api.patch<ProfileOut>('/api/profile/', data)
  return resp.data
}

export const deleteProfile = async (): Promise<void> => {
  await api.delete('/api/profile/')
}

// Alternative endpoint для получения профиля
export const getMe = async (): Promise<ProfileOut> => {
  const resp = await api.get<ProfileOut>('/api/me')
  return resp.data
} 