import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getItem,
  createItem,
  updateItem,
  type ItemCreate,
  type ItemUpdate,
} from '../../api/items'

// Helper to create empty item
const emptyItem: ItemCreate = {
  name: '',
  brand: '',
  color: '',
  image_url: '',
  description: '',
  price: undefined,
  category: '',
  article: '',
  size: '',
  style: '',
  collection: '',
}

const ItemForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [form, setForm] = useState<ItemCreate>(emptyItem)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) {
      getItem(Number(id))
        .then((data) => setForm({ ...(data as ItemCreate) }))
        .catch(() => setError('Не удалось загрузить вещь'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        const payload: ItemUpdate = { ...form }
        await updateItem(Number(id), payload)
      } else {
        await createItem(form)
      }
      navigate('/admin/items')
    } catch (err) {
      console.error(err)
      setError('Ошибка при сохранении')
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="mb-4 text-2xl font-semibold">{isEdit ? 'Редактировать вещь' : 'Создать вещь'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Название*</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Бренд</label>
            <input
              type="text"
              name="brand"
              value={form.brand || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Категория</label>
            <input
              type="text"
              name="category"
              value={form.category || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Цена</label>
            <input
              type="number"
              name="price"
              value={form.price ?? ''}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Размер</label>
            <input
              type="text"
              name="size"
              value={form.size || ''}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">URL изображения</label>
          <input
            type="url"
            name="image_url"
            value={form.image_url || ''}
            onChange={handleChange}
            className="mt-1 w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Описание</label>
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            className="mt-1 w-full rounded border p-2"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-4 py-2"
            onClick={() => navigate('/admin/items')}
          >
            Отмена
          </button>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Сохранить
          </button>
        </div>
      </form>
    </div>
  )
}

export default ItemForm 