import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../../api/client'

interface Item {
  id: number
  name: string
  image_url?: string | null
}

interface Outfit {
  id: number
  name: string
  style: string
  description?: string | null
  total_price?: number | null
  tops: Item[]
  bottoms: Item[]
  footwear: Item[]
  accessories: Item[]
  fragrances: Item[]
}

const OutfitDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const resp = await api.get<Outfit>(`/api/outfits/${id}`)
        setOutfit(resp.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchOutfit()
  }, [id])

  if (loading) return <div className="text-center py-8">Загрузка...</div>
  if (!outfit) return <div className="text-center py-8">Образ не найден</div>

  const categories = [
    { label: 'Верх', items: outfit.tops },
    { label: 'Низ', items: outfit.bottoms },
    { label: 'Обувь', items: outfit.footwear },
    { label: 'Аксессуары', items: outfit.accessories },
    { label: 'Ароматы', items: outfit.fragrances },
  ]

  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-2 text-2xl font-semibold">{outfit.name}</h1>
      <p className="mb-4 text-sm text-gray-600">Стиль: {outfit.style}</p>
      {outfit.description && <p className="mb-4 text-gray-700">{outfit.description}</p>}
      {outfit.total_price && <p className="mb-4 font-bold">Стоимость: {outfit.total_price}₸</p>}

      {categories.map((cat) => (
        <div key={cat.label} className="mb-6">
          <h2 className="mb-2 text-lg font-medium">{cat.label}</h2>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((i) => (
              <div key={i.id} className="w-24">
                {i.image_url ? (
                  <img src={i.image_url} alt={i.name} className="h-24 w-24 rounded object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded bg-gray-200" />
                )}
                <p className="mt-1 text-xs text-center">{i.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OutfitDetail 