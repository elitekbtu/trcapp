import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { listItems, type ItemOut } from '../../../api/items'
import { Button } from '../../ui/button'

// Mapping for UI labels and API categories
export const categoryConfig = [
  { key: 'tops', apiCategory: 'top', label: 'Верх' },
  { key: 'accessories', apiCategory: 'accessories', label: 'Аксессуары' },
  { key: 'bottoms', apiCategory: 'bottom', label: 'Низ' },
  { key: 'footwear', apiCategory: 'footwear', label: 'Обувь' },
  { key: 'fragrances', apiCategory: 'fragrances', label: 'Ароматы' },
] as const

type CategoryKey = (typeof categoryConfig)[number]['key']

interface IndexState {
  [k: string]: number
}

const OutfitBuilder = () => {
  const [itemsByCat, setItemsByCat] = useState<Record<string, ItemOut[]>>({})
  const [indexByCat, setIndexByCat] = useState<IndexState>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const promises = categoryConfig.map((c) =>
          listItems({ category: c.apiCategory, limit: 50 })
        )
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
        // eslint-disable-next-line no-console
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const cycle = (key: CategoryKey, dir: 'prev' | 'next') => {
    setIndexByCat((prev) => {
      const list = itemsByCat[key] || []
      if (list.length === 0) return prev
      const current = prev[key] ?? 0
      const nextIndex = dir === 'next' ? (current + 1) % list.length : (current - 1 + list.length) % list.length
      return { ...prev, [key]: nextIndex }
    })
  }

  const mannequinUrl = 'https://i.imgur.com/xXTcmEf.png' // Transparent mannequin silhouette

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Загрузка...</div>
  }

  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row md:items-start">
      {/* Mannequin Preview */}
      <div className="relative mx-auto h-[520px] w-[300px] shrink-0">
        <img
          src={mannequinUrl}
          alt="Mannequin"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {categoryConfig.map((c, i) => {
          const list = itemsByCat[c.key] || []
          const selected = list[indexByCat[c.key]]
          if (!selected || !selected.image_url) return null
          return (
            <img
              key={c.key}
              src={selected.image_url}
              alt={selected.name}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ zIndex: i + 1 }}
            />
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex-1 space-y-6">
        {categoryConfig.map((c) => {
          const list = itemsByCat[c.key] || []
          const idx = indexByCat[c.key]
          const selected = list[idx]
          return (
            <div key={c.key} className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cycle(c.key, 'prev')}
                disabled={list.length === 0}
                className="hover:bg-accent/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-1 items-center gap-4 overflow-hidden">
                <span className="w-28 shrink-0 text-sm font-medium">{c.label}</span>
                {selected ? (
                  <>
                    {selected.image_url ? (
                      <img
                        src={selected.image_url}
                        alt={selected.name}
                        className="h-20 w-20 rounded object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded bg-muted" />
                    )}
                    <span className="truncate text-sm">{selected.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Нет вариантов</span>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => cycle(c.key, 'next')}
                disabled={list.length === 0}
                className="hover:bg-accent/50"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OutfitBuilder 