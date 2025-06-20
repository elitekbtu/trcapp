import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'

interface User {
  id: number
  email: string
  is_admin: boolean
  is_active: boolean
}

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const resp = await api.get<User[]>('/api/users')
      setUsers(resp.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await api.delete(`/api/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="py-8 text-center">Загрузка...</div>

  return (
    <div>
      <div className="mb-4 text-right">
        <Link
          to="/admin/users/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Добавить пользователя
        </Link>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b p-2">ID</th>
            <th className="border-b p-2">Email</th>
            <th className="border-b p-2">Админ</th>
            <th className="border-b p-2">Активен</th>
            <th className="border-b p-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30">
              <td className="border-b p-2">{u.id}</td>
              <td className="border-b p-2">{u.email}</td>
              <td className="border-b p-2">{u.is_admin ? 'Да' : 'Нет'}</td>
              <td className="border-b p-2">{u.is_active ? 'Да' : 'Нет'}</td>
              <td className="border-b p-2 text-right flex gap-2 justify-end">
                <Link to={`/admin/users/${u.id}/edit`} className="text-blue-600 hover:underline">
                  Редактировать
                </Link>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(u.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UsersAdmin 