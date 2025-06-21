import React, { createContext, useContext, useEffect, useState } from 'react'
import { toggleFavoriteItem as apiToggleFavoriteItem, listFavoriteItems } from '../api/items'

interface FavoritesState {
  favoriteIds: number[]
  loading: boolean
  toggleFavorite: (id: number) => Promise<void>
  isFavorite: (id: number) => boolean
}

const FavoritesContext = createContext<FavoritesState | undefined>(undefined)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const fav = await listFavoriteItems()
        setFavoriteIds(fav.map((i) => i.id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleFavorite: FavoritesState['toggleFavorite'] = async (id) => {
    try {
      const resp = await apiToggleFavoriteItem(id)
      setFavoriteIds((prev) => {
        if (resp.favorited) {
          return prev.includes(id) ? prev : [...prev, id]
        }
        return prev.filter((x) => x !== id)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const isFavorite: FavoritesState['isFavorite'] = (id) => favoriteIds.includes(id)

  return (
    <FavoritesContext.Provider value={{ favoriteIds, loading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
} 