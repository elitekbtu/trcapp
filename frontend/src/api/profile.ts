import api from './client'

export interface ProfileOut {
  id: number
  email: string
  avatar?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  date_of_birth?: string
  height?: number
  weight?: number
  chest?: number
  waist?: number
  hips?: number
  favorite_colors?: string[]
  favorite_brands?: string[]
  is_admin?: boolean
}

export type ProfileUpdate = Partial<Omit<ProfileOut, 'id' | 'email' | 'is_admin'>>

export const getProfile = async () => {
  const resp = await api.get<ProfileOut>('/api/profile/')
  return resp.data
}

export const updateProfile = async (data: ProfileUpdate) => {
  const resp = await api.patch<ProfileOut>('/api/profile/', data)
  return resp.data
}

export const getMe = async () => {
  const resp = await api.get<ProfileOut>('/api/me')
  return resp.data
} 