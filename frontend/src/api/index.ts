export * from './auth'
export * from './cart'
export * from './client'
export * from './items'
export * from './outfits'
export * from './profile'
export * from './schemas'
export * from './users'

// Health check endpoint
import api from './client'

export const healthApi = {
  readinessCheck: async () => {
    const response = await api.get('/api/health/ready')
    return response.data
  }
} 