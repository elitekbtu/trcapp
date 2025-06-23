import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../../api/client'
import { Button } from '../../ui/Button'
import { Heart, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../ui/card'
import { Textarea } from '../../ui/textarea'
import { Skeleton } from '../../ui/skeleton'
import { type OutfitCommentOut } from '../../../api/schemas'
import {
  toggleFavoriteOutfit,
  listOutfitComments,
  addOutfitComment,
  likeOutfitComment,
  deleteOutfitComment,
} from '../../../api/outfits'
import RatingStars from '../../common/RatingStars'
import { useAuth } from '../../../context/AuthContext'
import { categoryConfig } from './OutfitBuilder'

interface Item {
  id: number
  name: string
  image_url?: string | null
}

interface Outfit {
  id: number
  name: string
  style: string
  description?: string | null
  total_price?: number | null
  tops: Item[]
  bottoms: Item[]
  footwear: Item[]
  accessories: Item[]
  fragrances: Item[]
}

const OutfitDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<OutfitCommentOut[]>([])
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState<number | undefined>()
  const [favorited, setFavorited] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const resp = await api.get<Outfit>(`/api/outfits/${id}`)
        setOutfit(resp.data)
        const commentsData = await listOutfitComments(Number(id))
        setComments(commentsData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchOutfit()
  }, [id])

  // Need to fetch favorited state separately
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!id || !user) return
      try {
        // We can check if this outfit is in the list of user's favorite outfits
        const favs = await api.get<Outfit[]>('/api/outfits/favorites')
        setFavorited(favs.data.some((o) => o.id === Number(id)))
      } catch (err) {
        // ignore, e.g. 401
      }
    }
    fetchFavoriteStatus()
  }, [id, user])

  const handleToggleFavorite = async () => {
    if (!id || user === null) return
    // Optimistic update
    setFavorited((prev) => !prev)
    try {
      await toggleFavoriteOutfit(Number(id))
    } catch (err) {
      // Revert on error
      setFavorited((prev) => !prev)
      console.error(err)
    }
  }

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return
    try {
      const newComm = await addOutfitComment(Number(id), { content: newComment, rating })
      setComments([newComm, ...comments])
      setNewComment('')
      setRating(undefined)
    } catch (err) {
      console.error(err)
    }
  }

  const previewLayers = useMemo(() => {
    if (!outfit) {
      // Return placeholders to keep indexes in sync
      return categoryConfig.map(() => null)
    }
    // Return array of image urls by same ordering as categoryConfig
    return categoryConfig.map((c) => {
      const key = c.key as keyof Outfit
      const items = outfit[key] as Item[] | undefined
      const first = items && items.length ? items[0] : undefined
      return first?.image_url || null
    })
  }, [outfit])

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
  if (!outfit) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-16 text-center">
      <Sparkles className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
      <h3 className="mb-2 font-display text-xl font-semibold">Образ не найден</h3>
      <p className="text-muted-foreground">Возможно, образ был удалён или перемещён.</p>
    </motion.div>
  )

  const categories = [
    { label: 'Верх', items: outfit.tops },
    { label: 'Низ', items: outfit.bottoms },
    { label: 'Обувь', items: outfit.footwear },
    { label: 'Аксессуары', items: outfit.accessories },
    { label: 'Ароматы', items: outfit.fragrances },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-foreground">{outfit.name}</h1>
          <p className="text-sm text-muted-foreground">Стиль: {outfit.style}</p>
        </div>
        <Button
          onClick={handleToggleFavorite}
          variant={favorited ? 'default' : 'outline'}
          className="gap-2"
        >
          <Heart className={`h-5 w-5 ${favorited ? 'fill-primary text-primary' : ''}`} />
          {favorited ? 'В избранном' : 'В избранное'}
        </Button>
      </div>

      {/* Top section: mannequin preview + description */}
      <div className="mb-12 grid gap-8 md:grid-cols-2 md:items-start">
        {/* Preview */}
        <div className="relative mx-auto h-[540px] w-[320px] shrink-0 rounded-xl border bg-card shadow-lg">
          <img
            src="/maneken.jpg"
            alt="Манекен"
            className="absolute inset-0 h-full w-full object-contain"
          />
          {previewLayers.map((url, idx) => {
            if (!url) return null
            return (
              <img
                key={idx}
                src={url}
                alt="layer"
                className="absolute inset-0 h-full w-full object-contain"
                style={{ zIndex: idx + 1 }}
              />
            )
          })}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {outfit.description && <p className="leading-relaxed">{outfit.description}</p>}
          {outfit.total_price && (
            <p className="text-xl font-semibold">
              Стоимость:{' '}
              {outfit.total_price.toLocaleString('ru-RU')} ₽
            </p>
          )}
        </div>
      </div>

      {/* Items by category */}
      <div className="space-y-10">
        {categories.map((cat) => (
          cat.items.length > 0 && (
            <div key={cat.label}>
              <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
                {cat.label}
              </h2>
              <div className="flex flex-wrap gap-6">
                {cat.items.map((i) => (
                  <div key={i.id} className="w-32 text-center">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="h-32 w-32 rounded object-cover shadow-sm"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded bg-muted" />
                    )}
                    <p className="mt-2 truncate text-sm font-medium">{i.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Comments */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 max-w-2xl"
      >
        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Отзывы</h2>

        {/* Add comment form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 rounded-lg border p-6"
        >
          <h3 className="mb-4 font-medium">Оставить отзыв</h3>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Ваша оценка</p>
              <RatingStars value={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder="Поделитесь впечатлениями об этом образе..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Отправить отзыв
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Comments list */}
        {comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border p-8 text-center"
          >
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium">Пока нет отзывов</h3>
            <p className="text-muted-foreground">Будьте первым, кто оставит отзыв об этом образе</p>
          </motion.div>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Пользователь</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {(user?.id === c.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={async () => {
                          if (!id) return
                          if (!confirm('Удалить комментарий?')) return
                          try {
                            await deleteOutfitComment(Number(id), c.id)
                            setComments((prev) => prev.filter((x) => x.id !== c.id))
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {c.rating !== undefined && c.rating !== null && (
                    <div className="mb-4">
                      <RatingStars value={c.rating} />
                    </div>
                  )}
                  <p className="mb-4 whitespace-pre-line text-muted-foreground">{c.content}</p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={async () => {
                        if (!id || !user) return
                        try {
                          await likeOutfitComment(Number(id), c.id)
                          const updated = await listOutfitComments(Number(id))
                          setComments(updated)
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                    >
                      <Heart className={`h-4 w-4 ${(c.likes ?? 0) > 0 ? 'fill-primary text-primary' : ''}`} />
                                              <span>{c.likes ?? 0}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  )
}

export default OutfitDetail 