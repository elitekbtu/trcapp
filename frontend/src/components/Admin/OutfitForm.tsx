import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createOutfit,
  updateOutfit,
  getOutfit,
  type OutfitCreate,
  type OutfitUpdate,
} from '../../api/outfits'

const emptyOutfit: OutfitCreate = {
  name: '',
  style: '',
  description: '',
  top_ids: [],
  bottom_ids: [],
  footwear_ids: [],
  accessories_ids: [],
  fragrances_ids: [],
}

const OutfitForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [form, setForm] = useState<OutfitCreate>(emptyOutfit)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) {
      getOutfit(Number(id))
        .then((data) => {
          setForm({
            name: data.name,
            style: data.style,
            description: data.description ?? '',
            top_ids: data.tops.map((t) => t.id),
            bottom_ids: data.bottoms.map((b) => b.id),
            footwear_ids: data.footwear.map((f) => f.id),
            accessories_ids: data.accessories.map((a) => a.id),
            fragrances_ids: data.fragrances.map((fr) => fr.id),
          })
        })
        .catch(() => setError('Не удалось загрузить образ'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleIdsChange = (name: keyof OutfitCreate, value: string) => {
    const ids = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number)
    setForm((prev) => ({ ...prev, [name]: ids }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        const payload: OutfitUpdate = { ...form }
        await updateOutfit(Number(id), payload)
      } else {
        await createOutfit(form)
      }
      navigate('/admin/outfits')
    } catch (err) {
      console.error(err)
      setError('Ошибка при сохранении')
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="mb-4 text-2xl font-semibold">{isEdit ? 'Редактировать образ' : 'Создать образ'}</h1>
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
        <div>
          <label className="block text-sm font-medium">Стиль*</label>
          <input
            type="text"
            name="style"
            value={form.style}
            onChange={handleChange}
            required
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
            rows={3}
          />
        </div>
        {/* IDs inputs */}
        {(
          [
            { key: 'top_ids', label: 'ID верха' },
            { key: 'bottom_ids', label: 'ID низа' },
            { key: 'footwear_ids', label: 'ID обуви' },
            { key: 'accessories_ids', label: 'ID аксессуаров' },
            { key: 'fragrances_ids', label: 'ID ароматов' },
          ] as const
        ).map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium">{field.label} (через запятую)</label>
            <input
              type="text"
              value={(form[field.key] ?? []).join(', ')}
              onChange={(e) => handleIdsChange(field.key, e.target.value)}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-4 py-2"
            onClick={() => navigate('/admin/outfits')}
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

export default OutfitForm 