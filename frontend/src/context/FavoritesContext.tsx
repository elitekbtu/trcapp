import React, { createContext, useContext, useEffect, useState } from 'react'
import { toggleFavoriteItem as apiToggleFavoriteItem, listFavoriteItems } from '../api/items'
import { useAuth } from './AuthContext'

interface FavoritesState {
  favoriteIds: number[]
  loading: boolean
  toggleFavorite: (id: number) => Promise<void>
  isFavorite: (id: number) => boolean
}

const FavoritesContext = createContext<FavoritesState | undefined>(undefined)

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  // Load favorites when user changes (login/logout)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (user) {
        try {
          const fav = await listFavoriteItems()
          setFavoriteIds(fav.map((i) => i.id))
        } catch (err) {
          // Ignore 401 or other errors silently for guests
          setFavoriteIds([])
          console.error(err)
        } finally {
          setLoading(false)
        }
      } else {
        // Guest – just empty list
        setFavoriteIds([])
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const toggleFavorite: FavoritesState['toggleFavorite'] = async (id) => {
    if (!user) return // guests can't favorite
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