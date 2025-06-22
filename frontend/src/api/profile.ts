import api from './client'
import { type ProfileOut, type ProfileUpdate } from './schemas'

export const getProfile = async () => {
  const resp = await api.get<ProfileOut>('/api/profile/')
  return resp.data
}

export const updateProfile = async (data: ProfileUpdate) => {
  const resp = await api.patch<ProfileOut>('/api/profile/', data)
  return resp.data
}

export const deleteProfile = async () => {
  await api.delete('/api/profile/')
} 