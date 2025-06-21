import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import { Label } from '../../ui/label'
import { useToast } from '../../ui/use-toast'
import { listItems, type ItemOut } from '../../../api/items'
import { createOutfit } from '../../../api/outfits'
import { categoryConfig } from './OutfitBuilder'

interface IndexState {
  [key: string]: number
}

// Map category key to payload field
const idFieldMap: Record<string, string> = {
  tops: 'top_ids',
  bottoms: 'bottom_ids',
  footwear: 'footwear_ids',
  accessories: 'accessories_ids',
  fragrances: 'fragrances_ids',
}

const CreateOutfit = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [itemsByCat, setItemsByCat] = useState<Record<string, ItemOut[]>>({})
  const [indexByCat, setIndexByCat] = useState<IndexState>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [style, setStyle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const promises = categoryConfig.map((c) => listItems({ clothing_type: c.apiType, limit: 50 }))
        const results = await Promise.all(promises)
        const grouped: Record<string, ItemOut[]> = {}
        const idx: IndexState = {}
        categoryConfig.forEach((c, i) => {
          grouped[c.key] = results[i]
          idx[c.key] = 0
        })
        setItemsByCat(grouped)
        setIndexByCat(idx)
      } catch (err) {
        console.error(err)
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить список вещей' })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [toast])

  const cycle = (key: string, dir: 'prev' | 'next') => {
    setIndexByCat((prev) => {
      const list = itemsByCat[key] || []
      if (list.length === 0) return prev
      const current = prev[key] ?? 0
      const next = dir === 'next' ? (current + 1) % list.length : (current - 1 + list.length) % list.length
      return { ...prev, [key]: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !style.trim()) {
      toast({ variant: 'destructive', title: 'Заполните обязательные поля' })
      return
    }

    setSubmitting(true)
    try {
      // Prepare payload
      const payload: Record<string, any> = {
        name,
        style,
        description,
      }
      categoryConfig.forEach((c) => {
        const list = itemsByCat[c.key] || []
        const idx = indexByCat[c.key]
        const selected = list[idx]
        if (selected) {
          (payload as any)[idFieldMap[c.key]] = [selected.id]
        }
      })
      const newOutfit = await createOutfit(payload as any)
      toast({ title: 'Образ создан', description: 'Вы перенаправлены на страницу образа' })
      navigate(`/outfits/${newOutfit.id}`)
    } catch (err) {
      console.error(err)
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать образ' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row md:items-start">
      {/* Builder preview */}
      <div className="flex-1">
        {/* Reuse preview from builder */}
        {/* We'll render similarly */}
        <div className="relative mx-auto h-[520px] w-[300px]">
          <img src="maneken.jpg" alt="Манекен" className="absolute inset-0 h-full w-full object-contain" />
          {categoryConfig.map((c, i) => {
            const list = itemsByCat[c.key] || []
            const sel = list[indexByCat[c.key]]
            if (!sel || !sel.image_url) return null
            return (
              <img key={c.key} src={sel.image_url} alt={sel.name} className="absolute inset-0 h-full w-full object-contain" style={{ zIndex: i + 1 }} />
            )
          })}
        </div>

        {/* Category controls */}
        <div className="mt-6 space-y-6">
          {categoryConfig.map((c) => {
            const list = itemsByCat[c.key] || []
            const idx = indexByCat[c.key]
            const selected = list[idx]
            return (
              <div key={c.key} className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => cycle(c.key, 'prev')} disabled={list.length === 0} className="hover:bg-accent/50">
                  ‹
                </Button>
                <div className="flex flex-1 items-center gap-4 overflow-hidden">
                  <span className="w-28 shrink-0 text-sm font-medium">{c.label}</span>
                  {selected ? (
                    <>
                      {selected.image_url ? (
                        <img src={selected.image_url} alt={selected.name} className="h-20 w-20 rounded object-cover" />
                      ) : (
                        <div className="h-20 w-20 rounded bg-muted" />
                      )}
                      <span className="truncate text-sm">{selected.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Нет вариантов</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => cycle(c.key, 'next')} disabled={list.length === 0} className="hover:bg-accent/50">
                  ›
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form fields */}
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3">
          <Label htmlFor="name">Название образа*</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" required />
        </div>
        <div className="space-y-3">
          <Label htmlFor="style">Стиль*</Label>
          <Input id="style" value={style} onChange={(e) => setStyle(e.target.value)} placeholder="Кэжуал, streetwear..." required />
        </div>
        <div className="space-y-3">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание" rows={4} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="gap-2 bg-primary hover:bg-primary/90">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {!submitting && <Save className="h-4 w-4" />}
            {submitting ? 'Сохранение...' : 'Создать образ'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CreateOutfit 