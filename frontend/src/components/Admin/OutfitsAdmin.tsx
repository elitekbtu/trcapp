import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

interface Outfit {
  id: number
  name: string
  style: string
  total_price?: number | null
}

const OutfitsAdmin = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchOutfits()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить образ?')) return
    try {
      await api.delete(`/api/outfits/${id}`)
      setOutfits((prev) => prev.filter((o) => o.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>

  return (
    <div>
      <div className="mb-4 text-right">
        <Link
          to="/admin/outfits/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Добавить образ
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b p-2">ID</th>
            <th className="border-b p-2">Название</th>
            <th className="border-b p-2">Стиль</th>
            <th className="border-b p-2">Цена</th>
            <th className="border-b p-2"></th>
          </tr>
        </thead>
        <tbody>
          {outfits.map((o) => (
            <tr key={o.id} className="hover:bg-muted/30">
              <td className="border-b p-2">{o.id}</td>
              <td className="border-b p-2">{o.name}</td>
              <td className="border-b p-2">{o.style}</td>
              <td className="border-b p-2">{o.total_price ?? '-'}</td>
              <td className="border-b p-2 text-right flex gap-2 justify-end">
                <Link to={`/admin/outfits/${o.id}/edit`} className="text-blue-600 hover:underline">
                  Редактировать
                </Link>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(o.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OutfitsAdmin 