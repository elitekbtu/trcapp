import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../../api/client'
import { Button } from '../../ui/button'
import { Heart } from 'lucide-react'
import type { OutfitCommentOut } from '../../../api/outfits'
import { toggleFavoriteOutfit, listOutfitComments, addOutfitComment, likeOutfitComment, deleteOutfitComment } from '../../../api/outfits'
import RatingStars from '../../common/RatingStars'
import { useAuth } from '../../../context/AuthContext'

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

  const handleToggleFavorite = async () => {
    if (!id) return
    try {
      const resp = await toggleFavoriteOutfit(Number(id))
      setFavorited(resp.favorited)
    } catch (err) {
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

  if (loading) return <div className="text-center py-8">Загрузка...</div>
  if (!outfit) return <div className="text-center py-8">Образ не найден</div>

  const categories = [
    { label: 'Верх', items: outfit.tops },
    { label: 'Низ', items: outfit.bottoms },
    { label: 'Обувь', items: outfit.footwear },
    { label: 'Аксессуары', items: outfit.accessories },
    { label: 'Ароматы', items: outfit.fragrances },
  ]

  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-2 text-2xl font-semibold">{outfit.name}</h1>
      <p className="mb-4 text-sm text-gray-600">Стиль: {outfit.style}</p>
      {outfit.description && <p className="mb-4 text-gray-700">{outfit.description}</p>}
      {outfit.total_price && <p className="mb-4 font-bold">Стоимость: {outfit.total_price}₸</p>}

      <Button onClick={handleToggleFavorite} variant={favorited ? 'default' : 'outline'} className="mb-6 flex items-center gap-2">
        <Heart className={`h-5 w-5 ${favorited ? 'fill-primary text-primary' : ''}`} />
        {favorited ? 'В избранном' : 'В избранное'}
      </Button>

      {categories.map((cat) => (
        <div key={cat.label} className="mb-6">
          <h2 className="mb-2 text-lg font-medium">{cat.label}</h2>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((i) => (
              <div key={i.id} className="w-24">
                {i.image_url ? (
                  <img src={i.image_url} alt={i.name} className="h-24 w-24 rounded object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded bg-gray-200" />
                )}
                <p className="mt-1 text-xs text-center">{i.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Comments */}
      <div className="mt-10 max-w-2xl">
        <h2 className="mb-4 text-xl font-medium">Комментарии</h2>
        <div className="mb-6 space-y-2">
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Ваш отзыв..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <RatingStars value={rating} onChange={setRating} />
            <Button onClick={handleAddComment}>Отправить</Button>
          </div>
        </div>
        {comments.length === 0 && <p className="text-muted-foreground">Нет комментариев</p>}
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded border p-3">
              <p className="mb-1 text-sm whitespace-pre-line">{c.content}</p>
              {c.rating !== undefined && c.rating !== null && (
                <RatingStars value={c.rating} className="mb-1" />
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{new Date(c.created_at).toLocaleString()}</span>
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={async () => {
                    if (!id) return
                    try {
                      const resp = await likeOutfitComment(Number(id), c.id)
                      setComments((prev) =>
                        prev.map((x) =>
                          x.id === c.id ? { ...x, likes: resp.liked ? x.likes + 1 : x.likes - 1 } : x
                        )
                      )
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                >
                  <Heart className="h-3 w-3" /> {c.likes}
                </button>
                {(user?.id === c.user_id || isAdmin) && (
                  <button
                    className="text-xs text-red-500 hover:underline"
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
                    Удалить
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default OutfitDetail 