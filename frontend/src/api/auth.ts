import api, { setStoredTokens, clearStoredTokens } from './client'

export interface TokensUser {
  access_token: string
  refresh_token: string
  user: {
    id: number
    email: string
    is_admin?: boolean
    avatar?: string | null
    first_name?: string | null
    last_name?: string | null
  }
}

export const registerApi = async (email: string, password: string) => {
  const resp = await api.post<TokensUser>('/api/auth/register', { email, password })
  setStoredTokens(resp.data.access_token, resp.data.refresh_token)
  return resp.data
}

export const loginApi = async (email: string, password: string) => {
  // FastAPI expects OAuth2PasswordRequestForm (application/x-www-form-urlencoded)
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const resp = await api.post<TokensUser>('/api/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  setStoredTokens(resp.data.access_token, resp.data.refresh_token)
  return resp.data
}

export const logoutApi = async (refreshToken?: string) => {
  try {
    await api.post('/api/auth/logout', { refresh_token: refreshToken })
  } catch (err) {
    // ignore
  }
  clearStoredTokens()
} 