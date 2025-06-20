import { Outlet, Link } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-6 text-2xl font-bold">Админ панель</h1>
      <nav className="mb-4 flex gap-4 border-b pb-2 text-sm">
        <Link to="/admin/users" className="hover:underline">
          Пользователи
        </Link>
        <Link to="/admin/items" className="hover:underline">
          Вещи
        </Link>
        <Link to="/admin/outfits" className="hover:underline">
          Образы
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}

export default AdminDashboard 