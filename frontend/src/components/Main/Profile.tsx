import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()

  return (
    <section className="container mx-auto max-w-xl space-y-6 px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-semibold"
      >
        Профиль
      </motion.h2>
      <div className="rounded-lg border p-6 shadow-sm">
        <p className="text-sm text-gray-500">Имя</p>
        <p className="text-lg font-medium">{user?.first_name || 'Неизвестно'}</p>
        <p className="mt-4 text-sm text-gray-500">Email</p>
        <p className="text-lg font-medium">{user?.email || 'example@mail.com'}</p>
      </div>
    </section>
  )
}

export default Profile 