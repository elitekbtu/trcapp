import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import {
  getItem,
  createItem,
  updateItem,
  type ItemCreate,
  type ItemUpdate,
} from '../../api/items'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { useToast } from '../../components/ui/use-toast'
import { cn } from '../../lib/utils'

const emptyItem: ItemCreate = {
  name: '',
  brand: '',
  color: '',
  clothing_type: 'top',
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
  const { toast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState<ItemCreate>(emptyItem)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (isEdit) {
          const data = await getItem(Number(id))
          setForm({ ...(data as ItemCreate) })
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось загрузить данные о товаре',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id, isEdit, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value === '' ? undefined : Number(value) }))
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (isEdit) {
        const payload: ItemUpdate = { ...form }
        await updateItem(Number(id), payload)
        toast({
          title: 'Успешно',
          description: 'Товар успешно обновлен',
        })
      } else {
        const formData = new FormData()
        Object.entries(form).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            formData.append(key, String(value))
          }
        })
        files.forEach((file) => {
          formData.append('images', file)
        })
        await createItem(formData)
        toast({
          title: 'Успешно',
          description: 'Товар успешно создан',
        })
      }
      navigate('/admin/items')
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-4xl px-4 py-8"
    >
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/items')}
          className="shrink-0 hover:bg-accent/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isEdit ? 'Редактирование товара' : 'Создание нового товара'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Основная информация
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Название*
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Название товара"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="brand" className="text-sm font-medium text-muted-foreground">
                Бренд
              </Label>
              <Input
                id="brand"
                name="brand"
                value={form.brand || ''}
                onChange={handleChange}
                placeholder="Бренд"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                Категория
              </Label>
              <Input
                id="category"
                name="category"
                value={form.category || ''}
                onChange={handleChange}
                placeholder="Категория"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="clothing_type" className="text-sm font-medium text-muted-foreground">
                Тип одежды (top, bottom...)
              </Label>
              <select
                id="clothing_type"
                name="clothing_type"
                value={form.clothing_type}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="top">Верх</option>
                <option value="bottom">Низ</option>
                <option value="accessories">Аксессуары</option>
                <option value="footwear">Обувь</option>
                <option value="fragrances">Ароматы</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="price" className="text-sm font-medium text-muted-foreground">
                Цена
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={form.price ?? ''}
                onChange={handleNumberChange}
                placeholder="Цена"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="size" className="text-sm font-medium text-muted-foreground">
                Размер
              </Label>
              <Input
                id="size"
                name="size"
                value={form.size || ''}
                onChange={handleChange}
                placeholder="Размер"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="color" className="text-sm font-medium text-muted-foreground">
                Цвет
              </Label>
              <Input
                id="color"
                name="color"
                value={form.color || ''}
                onChange={handleChange}
                placeholder="Цвет"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Изображение и описание
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="image_url" className="text-sm font-medium text-muted-foreground">
                URL изображения
              </Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={form.image_url || ''}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="image_files" className="text-sm font-medium text-muted-foreground">
                Загрузить изображения
              </Label>
              <Input
                id="image_files"
                name="image_files"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Previews for selected files */}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {files.map((file, idx) => (
                  <div key={idx} className="relative h-32 w-full overflow-hidden rounded-lg border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview for image URL */}
            {form.image_url && (
              <div className="flex justify-center">
                <div className="relative h-48 w-48 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <img
                    src={form.image_url}
                    alt="Предпросмотр"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                Описание
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Подробное описание товара"
                rows={5}
                className="min-h-[120px] focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/items')}
            className="border-muted-foreground/30 hover:bg-muted/50"
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className={cn('h-4 w-4', !submitting && 'mr-2')} />
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default ItemForm