import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

const RequireAdmin: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAdmin, loading } = useAuth()

  if (loading) return <div className="text-center py-8">Загрузка...</div>

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return children
}

export default RequireAdmin 