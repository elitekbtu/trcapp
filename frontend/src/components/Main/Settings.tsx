import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { getProfile, updateProfile, deleteProfile } from '../../api/profile'
import { type ProfileUpdate } from '../../api/schemas'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useToast } from '../ui/use-toast'
import { useAuth } from '../../context/AuthContext'

const emptyProfile: ProfileUpdate = {
  avatar: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  date_of_birth: '',
  height: undefined,
  weight: undefined,
  chest: undefined,
  waist: undefined,
  hips: undefined,
  favorite_colors: '',
  favorite_brands: '',
}

const Settings = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { logout } = useAuth()

  const [form, setForm] = useState<ProfileUpdate>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        setForm({
          avatar: data.avatar || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          date_of_birth: data.date_of_birth || '',
          height: data.height,
          weight: data.weight,
          chest: data.chest,
          waist: data.waist,
          hips: data.hips,
          favorite_colors: Array.isArray(data.favorite_colors)
            ? data.favorite_colors.join(', ')
            : (data.favorite_colors as string) || '',
          favorite_brands: Array.isArray(data.favorite_brands)
            ? data.favorite_brands.join(', ')
            : (data.favorite_brands as string) || '',
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось загрузить профиль',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev: ProfileUpdate) => ({ ...prev, [name as keyof ProfileUpdate]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const num = value === '' ? undefined : Number(value)
    if (num !== undefined && num < 0) return // игнорируем отрицательные значения
    setForm((prev: ProfileUpdate) => ({ ...prev, [name as keyof ProfileUpdate]: num }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    // 1. Телефон (опционально) — формат +77071234567, 7-15 цифр
    if (form.phone_number) {
      const phoneRegex = /^\+?[0-9]{7,15}$/
      if (!phoneRegex.test(form.phone_number)) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Некорректный телефонный номер' })
        return
      }
    }

    // 2. Дата рождения — не в будущем
    if (form.date_of_birth) {
      const selected = new Date(form.date_of_birth)
      const today = new Date()
      // Обрезаем время у today
      today.setHours(0,0,0,0)
      if (selected > today) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Дата рождения не может быть в будущем' })
        return
      }
    }

    // 3. Положительные числовые значения
    const numericFields: (keyof ProfileUpdate)[] = ['height', 'weight', 'chest', 'waist', 'hips']
    for (const field of numericFields) {
      const value = form[field] as number | undefined
      if (value !== undefined && value <= 0) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Числовые параметры должны быть положительными' })
        return
      }
    }

    // 4. URL аватара (опционально)
    if (form.avatar && !/^https?:\/\//.test(form.avatar)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Ссылка на аватар должна начинаться с http:// или https://' })
      return
    }

    setSubmitting(true)
    try {
      await updateProfile(form)
      toast({
        title: 'Успешно',
        description: 'Профиль обновлен',
        className: 'border-0 bg-green-500 text-white shadow-lg',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось обновить профиль',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) return
    setDeleting(true)
    try {
      await deleteProfile()
      await logout()
      navigate('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось удалить аккаунт',
      })
    } finally {
      setDeleting(false)
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-3xl px-4 py-12"
    >
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Настройки профиля</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Основная информация</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">
                Имя
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={form.first_name || ''}
                onChange={handleChange}
                placeholder="Имя"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">
                Фамилия
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={form.last_name || ''}
                onChange={handleChange}
                placeholder="Фамилия"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="phone_number" className="text-sm font-medium text-muted-foreground">
                Телефон
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={form.phone_number || ''}
                onChange={handleChange}
                placeholder="+77071234567"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="date_of_birth" className="text-sm font-medium text-muted-foreground">
                Дата рождения
              </Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth || ''}
                onChange={handleChange}
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="avatar" className="text-sm font-medium text-muted-foreground">
                Ссылка на аватар
              </Label>
              <Input
                id="avatar"
                name="avatar"
                value={form.avatar || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Параметры тела</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="height" className="text-sm font-medium text-muted-foreground">
                Рост (см)
              </Label>
              <Input
                id="height"
                name="height"
                type="number"
                value={form.height ?? ''}
                onChange={handleNumberChange}
                placeholder="e.g. 180"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="weight" className="text-sm font-medium text-muted-foreground">
                Вес (кг)
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={form.weight ?? ''}
                onChange={handleNumberChange}
                placeholder="e.g. 75"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="chest" className="text-sm font-medium text-muted-foreground">
                Грудь (см)
              </Label>
              <Input
                id="chest"
                name="chest"
                type="number"
                value={form.chest ?? ''}
                onChange={handleNumberChange}
                placeholder="e.g. 96"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="waist" className="text-sm font-medium text-muted-foreground">
                Талия (см)
              </Label>
              <Input
                id="waist"
                name="waist"
                type="number"
                value={form.waist ?? ''}
                onChange={handleNumberChange}
                placeholder="e.g. 78"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="hips" className="text-sm font-medium text-muted-foreground">
                Бедра (см)
              </Label>
              <Input
                id="hips"
                name="hips"
                type="number"
                value={form.hips ?? ''}
                onChange={handleNumberChange}
                placeholder="e.g. 100"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Предпочтения</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="favorite_colors" className="text-sm font-medium text-muted-foreground">
                Любимые цвета (через запятую)
              </Label>
              <Textarea
                id="favorite_colors"
                name="favorite_colors"
                value={Array.isArray(form.favorite_colors) ? form.favorite_colors.join(', ') : (form.favorite_colors || '')}
                onChange={handleChange}
                placeholder="Красный, Черный, Белый"
                className="resize-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="favorite_brands" className="text-sm font-medium text-muted-foreground">
                Любимые бренды (через запятую)
              </Label>
              <Textarea
                id="favorite_brands"
                name="favorite_brands"
                value={Array.isArray(form.favorite_brands) ? form.favorite_brands.join(', ') : (form.favorite_brands || '')}
                onChange={handleChange}
                placeholder="Nike, Adidas, Zara"
                className="resize-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Удалить аккаунт
          </Button>
          <Button type="submit" disabled={submitting} className="flex items-center gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {!submitting && <Save className="h-4 w-4" />}
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </motion.section>
  )
}

export default Settings 
