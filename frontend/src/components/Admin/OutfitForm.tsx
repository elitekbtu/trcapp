import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, X } from 'lucide-react'
import { getOutfit, createOutfit, updateOutfit } from '../../api/outfits'
import { listItems } from '../../api/items'
import { type OutfitCreate, type OutfitUpdate, type OutfitItemCreate, type ItemOut } from '../../api/schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'

import { useToast } from '../../components/ui/use-toast'

const emptyOutfit: OutfitCreate = {
  name: '',
  style: '',
  description: '',
  items: [],
  collection: '',
  tags: [],
  season: '',
  occasion: '',
  outfit_type: 'user',
  is_public: true,
}

const OutfitForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState<OutfitCreate>(emptyOutfit)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableItems, setAvailableItems] = useState<ItemOut[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем доступные товары
        const items = await listItems({ limit: 1000 })
        setAvailableItems(items)

        if (isEdit) {
          const data = await getOutfit(Number(id))
          setForm({
            name: data.name,
            style: data.style,
            description: data.description ?? '',
            items: Object.entries(data.items).flatMap(([category, categoryItems]) =>
              (categoryItems as any[]).map(item => ({
                item_id: item.id,
                category: category === 'tops' ? 'top' : 
                         category === 'bottoms' ? 'bottom' :
                         category === 'footwear' ? 'footwear' :
                         category === 'accessories' ? 'accessory' : 'fragrance'
              }))
            ),
            collection: data.collection ?? '',
            tags: [],
            season: '',
            occasion: '',
            outfit_type: 'user',
            is_public: true,
          })
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isEdit, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev: OutfitCreate) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof OutfitCreate, value: any) => {
    setForm((prev: OutfitCreate) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    setForm((prev: OutfitCreate) => ({ ...prev, tags }))
  }

  const addItem = (itemId: number, category: string) => {
    const newItem: OutfitItemCreate = {
      item_id: itemId,
      category,
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!form.name.trim() || !form.style.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Название и стиль обязательны' })
      return
    }
    
    if (form.items.length === 0) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Добавьте хотя бы один элемент в образ' })
      return
    }

    setSubmitting(true)

    try {
      if (isEdit) {
        const payload: OutfitUpdate = { ...form }
        await updateOutfit(Number(id), payload)
        toast({
          title: 'Успешно',
          description: 'Образ успешно обновлен',
        })
      } else {
        await createOutfit(form)
        toast({
          title: 'Успешно',
          description: 'Образ успешно создан',
        })
      }
      navigate('/admin/outfits')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при сохранении',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getItemById = (itemId: number) => availableItems.find(item => item.id === itemId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-3xl px-4 py-8"
    >
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/outfits')}
          className="shrink-0 hover:bg-accent/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isEdit ? 'Редактирование образа' : 'Создание нового образа'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Основная информация</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="name">Название*</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Название образа"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="style">Стиль*</Label>
              <Input
                id="style"
                name="style"
                value={form.style}
                onChange={handleChange}
                required
                placeholder="Стиль образа"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="collection">Коллекция</Label>
              <Input
                id="collection"
                name="collection"
                value={form.collection || ''}
                onChange={handleChange}
                placeholder="Напр. Summer 2024"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="season">Сезон</Label>
              <select
                id="season"
                name="season"
                value={form.season || ''}
                onChange={(e) => handleSelectChange('season', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Выберите сезон</option>
                <option value="spring">Весна</option>
                <option value="summer">Лето</option>
                <option value="autumn">Осень</option>
                <option value="winter">Зима</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="occasion">Повод</Label>
              <Input
                id="occasion"
                name="occasion"
                value={form.occasion || ''}
                onChange={handleChange}
                placeholder="Напр. Офис, Вечеринка"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                value={form.tags?.join(', ') || ''}
                onChange={handleTagsChange}
                placeholder="casual, elegant, sport"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              placeholder="Описание образа"
              rows={3}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Элементы образа</h2>
          
          {/* Добавление элементов */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="addItem">Добавить товар</Label>
              <select
                id="addItem"
                onChange={(e) => {
                  if (e.target.value) {
                    const [itemId, category] = e.target.value.split(':')
                    addItem(Number(itemId), category)
                    e.target.value = '' // Сбрасываем выбор
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Выберите товар и категорию</option>
                {availableItems.map(item => (
                  <optgroup key={item.id} label={item.name}>
                    <option value={`${item.id}:top`}>{item.name} (Верх)</option>
                    <option value={`${item.id}:bottom`}>{item.name} (Низ)</option>
                    <option value={`${item.id}:footwear`}>{item.name} (Обувь)</option>
                    <option value={`${item.id}:accessory`}>{item.name} (Аксессуар)</option>
                    <option value={`${item.id}:fragrance`}>{item.name} (Парфюм)</option>
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Список добавленных элементов */}
          <div className="space-y-3">
            {form.items.map((item, index) => {
              const itemData = getItemById(item.item_id)
              return (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium">{itemData?.name || `Товар #${item.item_id}`}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({item.category === 'top' ? 'Верх' : 
                        item.category === 'bottom' ? 'Низ' :
                        item.category === 'footwear' ? 'Обувь' :
                        item.category === 'accessory' ? 'Аксессуар' : 'Парфюм'})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            
            {form.items.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Элементы образа не добавлены
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/outfits')}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              isEdit ? 'Обновить образ' : 'Создать образ'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default OutfitForm