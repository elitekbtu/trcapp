import api, { setStoredTokens, clearStoredTokens } from './client'

export interface TokensUser {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: number
    email: string
    is_admin?: boolean
    avatar?: string | null
    first_name?: string | null
    last_name?: string | null
    phone_number?: string | null
    date_of_birth?: string | null
    height?: number | null
    weight?: number | null
    chest?: number | null
    waist?: number | null
    hips?: number | null
    favorite_colors?: string[] | null
    favorite_brands?: string[] | null
  }
}

export const registerApi = async (email: string, password: string) => {
  try {
    const resp = await api.post<TokensUser>('/api/auth/register', { email, password })
    setStoredTokens(resp.data.access_token, resp.data.refresh_token)
    return resp.data
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 400) {
        throw new Error('Пользователь с таким email уже существует')
      }
    }
    throw new Error('Ошибка при регистрации')
  }
}

export const loginApi = async (email: string, password: string) => {
  try {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)

    const resp = await api.post<TokensUser>('/api/auth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    setStoredTokens(resp.data.access_token, resp.data.refresh_token)
    return resp.data
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Неверный email или пароль')
      }
      if (error.response.status === 404) {
        throw new Error('Пользователь не найден')
      }
    }
    throw new Error('Ошибка при входе')
  }
}

export const logoutApi = async (refreshToken?: string) => {
  try {
    await api.post('/api/auth/logout', { refresh_token: refreshToken })
  } catch (err) {
    // ignore
  }
  clearStoredTokens()
}

export const googleLoginApi = () => {
  const googleLoginUrl = `${api.defaults.baseURL}/api/auth/google/login`
  window.location.href = googleLoginUrl
}

export const handleGoogleCallbackApi = async (code: string) => {
  try {
    const resp = await api.get<TokensUser>('/api/auth/google/callback', { params: { code } })
    setStoredTokens(resp.data.access_token, resp.data.refresh_token)
    return resp.data
  } catch (error: any) {
    throw new Error('Ошибка при аутентификации через Google')
  }
}