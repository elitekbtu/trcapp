import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

interface Item {
  id: number
  name: string
  price?: number | null
}

const ItemsAdmin = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      const resp = await api.get<Item[]>('/api/items/')
      setItems(resp.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить вещь?')) return
    try {
      await api.delete(`/api/items/${id}`)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>

  return (
    <div>
      <div className="mb-4 text-right">
        <Link
          to="/admin/items/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Добавить вещь
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b p-2">ID</th>
            <th className="border-b p-2">Название</th>
            <th className="border-b p-2">Цена</th>
            <th className="border-b p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="hover:bg-muted/30">
              <td className="border-b p-2">{it.id}</td>
              <td className="border-b p-2">{it.name}</td>
              <td className="border-b p-2">{it.price ?? '-'}</td>
              <td className="border-b p-2 text-right flex gap-2 justify-end">
                <Link to={`/admin/items/${it.id}/edit`} className="text-blue-600 hover:underline">
                  Редактировать
                </Link>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(it.id)}>
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

export default ItemsAdmin 