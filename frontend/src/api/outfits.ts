import api from './client'

// Base outfit item type (simplified)
export interface OutfitItemBase {
  id: number
  name: string
  brand?: string
  image_url?: string
  price?: number
}

export interface OutfitCreate {
  name: string
  style: string
  description?: string
  top_ids?: number[]
  bottom_ids?: number[]
  footwear_ids?: number[]
  accessories_ids?: number[]
  fragrances_ids?: number[]
}

export interface OutfitUpdate extends Partial<OutfitCreate> {}

export interface OutfitOut extends OutfitCreate {
  id: number
  owner_id: string
  created_at?: string
  updated_at?: string
  tops: OutfitItemBase[]
  bottoms: OutfitItemBase[]
  footwear: OutfitItemBase[]
  accessories: OutfitItemBase[]
  fragrances: OutfitItemBase[]
  total_price?: number
}

export interface ListOutfitsParams {
  skip?: number
  limit?: number
  q?: string
  style?: string
  min_price?: number
  max_price?: number
  sort_by?: string
}

export const listOutfits = async (params: ListOutfitsParams = {}) => {
  const resp = await api.get<OutfitOut[]>('/api/outfits/', { params })
  return resp.data
}

export const getOutfit = async (id: number) => {
  const resp = await api.get<OutfitOut>(`/api/outfits/${id}`)
  return resp.data
}

export const createOutfit = async (data: OutfitCreate) => {
  const resp = await api.post<OutfitOut>('/api/outfits/', data)
  return resp.data
}

export const updateOutfit = async (id: number, data: OutfitUpdate) => {
  const resp = await api.put<OutfitOut>(`/api/outfits/${id}`, data)
  return resp.data
}

export const deleteOutfit = async (id: number) => {
  await api.delete(`/api/outfits/${id}`)
} 