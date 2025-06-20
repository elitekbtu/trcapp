import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../../api/client'

interface Item {
  id: number
  name: string
  brand?: string | null
  description?: string | null
  price?: number | null
  image_url?: string | null
  color?: string | null
  category?: string | null
  size?: string | null
  style?: string | null
  collection?: string | null
}

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<Item | null>(null)
  const [similar, setSimilar] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return
        const [detailResp, similarResp] = await Promise.all([
          api.get<Item>(`/api/items/${id}`),
          api.get<Item[]>(`/api/items/${id}/similar`),
        ])
        setItem(detailResp.data)
        setSimilar(similarResp.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="py-8 text-center">Загрузка...</div>
  if (!item) return <div className="py-8 text-center">Вещь не найдена</div>

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8 flex flex-col md:flex-row gap-6">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-72 w-full max-w-md rounded object-cover"
          />
        ) : (
          <div className="h-72 w-full max-w-md rounded bg-gray-200" />
        )}
        <div>
          <h1 className="mb-2 text-2xl font-semibold">{item.name}</h1>
          {item.brand && <p className="text-sm text-gray-600 mb-1">Бренд: {item.brand}</p>}
          {item.category && <p className="text-sm text-gray-600 mb-1">Категория: {item.category}</p>}
          {item.color && <p className="text-sm text-gray-600 mb-1">Цвет: {item.color}</p>}
          {item.size && <p className="text-sm text-gray-600 mb-1">Размер: {item.size}</p>}
          {item.price !== null && item.price !== undefined && (
            <p className="mt-4 text-xl font-bold">{item.price}₸</p>
          )}
          {item.description && <p className="mt-4 whitespace-pre-line">{item.description}</p>}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-medium">Похожие товары</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {similar.map((it) => (
              <div key={it.id} className="rounded-md border p-4">
                {it.image_url ? (
                  <img
                    src={it.image_url}
                    alt={it.name}
                    className="mb-3 h-40 w-full rounded object-cover"
                  />
                ) : (
                  <div className="mb-3 h-40 w-full rounded bg-gray-200" />
                )}
                <h3 className="text-lg font-medium">{it.name}</h3>
                {it.price !== null && it.price !== undefined && (
                  <p className="mt-2 font-semibold">{it.price}₸</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemDetail 