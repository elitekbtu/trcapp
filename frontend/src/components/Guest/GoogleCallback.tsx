import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setStoredTokens } from '../../api/client'
import type { TokensUser } from '../../api/auth'

const GoogleCallback = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (!code) {
        setError('Не удалось получить код авторизации от Google')
        return
      }
      try {
        const resp = await api.get<TokensUser>(`/api/auth/google/callback?code=${encodeURIComponent(code)}`)
        const { access_token, refresh_token } = resp.data
        setStoredTokens(access_token, refresh_token)
        // Persist user for UI while profile loads
        localStorage.setItem('user', JSON.stringify(resp.data.user))
        // Redirect to home page (full reload ensures AuthProvider fetches profile)
        window.location.replace('/home')
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Google callback error', err)
        setError('Ошибка входа через Google')
      }
    }
    handleCallback()
  }, [navigate])

  if (error) {
    return <div className="text-center py-16 text-red-600">{error}</div>
  }

  return <div className="text-center py-16">Завершаем вход через Google...</div>
}

export default GoogleCallback 