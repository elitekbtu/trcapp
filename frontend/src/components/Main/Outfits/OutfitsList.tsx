import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../../api/client'

interface Outfit {
  id: number
  name: string
  style: string
  total_price?: number | null
}

const OutfitsList = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        const resp = await api.get<Outfit[]>('/api/outfits')
        setOutfits(resp.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOutfits()
  }, [])

  if (loading) return <div className="text-center py-8">Загрузка...</div>

  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-6 text-2xl font-semibold">Образы</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {outfits.map((o) => (
          <Link key={o.id} to={`/outfits/${o.id}`} className="block rounded-md border p-4 hover:shadow">
            <h3 className="text-lg font-medium">{o.name}</h3>
            <p className="text-sm text-gray-500">Стиль: {o.style}</p>
            {o.total_price && <p className="mt-2 font-semibold">{o.total_price}₸</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default OutfitsList 