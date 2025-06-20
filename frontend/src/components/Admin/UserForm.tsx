import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, createUser, updateUser, type UserCreateAdmin, type UserUpdateAdmin } from '../../api/users'

const emptyUser: UserCreateAdmin = {
  email: '',
  password: '',
  is_admin: false,
  is_active: true,
}

const UserForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [form, setForm] = useState<UserCreateAdmin>(emptyUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) {
      getUser(Number(id))
        .then((u) =>
          setForm({
            email: u.email,
            password: '',
            is_admin: !!u.is_admin,
            is_active: !!u.is_active,
          }),
        )
        .catch(() => setError('Не удалось загрузить пользователя'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEdit) {
        const payload: UserUpdateAdmin = {
          email: form.email,
          password: form.password || undefined,
          is_admin: form.is_admin,
          is_active: form.is_active,
        }
        await updateUser(Number(id), payload)
      } else {
        await createUser(form)
      }
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      setError('Ошибка при сохранении')
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="mb-4 text-2xl font-semibold">{isEdit ? 'Редактировать пользователя' : 'Создать пользователя'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email*</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border p-2"
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium">Пароль*</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
        )}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium">Новый пароль</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_admin" checked={!!form.is_admin} onChange={handleChange} />
          <label>Администратор</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={handleChange} />
          <label>Активен</label>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-4 py-2" onClick={() => navigate('/admin/users')}>
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

export default UserForm 