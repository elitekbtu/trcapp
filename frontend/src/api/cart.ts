import api from './client';
import type { 
  CartResponse, 
  CartItemCreate, 
  CartItemUpdate, 
  CartItemResponse, 
  CartSummary,
  CartStateOut 
} from './schemas';

export const cartApi = {
  // Получить корзину
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get<CartResponse>('/api/cart/');
    return response.data;
  },

  // Добавить товар в корзину
  addToCart: async (data: CartItemCreate): Promise<CartItemResponse> => {
    const response = await api.post<CartItemResponse>('/api/cart/add', data);
    return response.data;
  },

  // Обновить товар в корзине
  updateCartItem: async (itemId: number, data: CartItemUpdate): Promise<CartItemResponse> => {
    const response = await api.patch<CartItemResponse>(`/api/cart/${itemId}`, data);
    return response.data;
  },

  // Удалить товар из корзины
  removeFromCart: async (itemId: number): Promise<void> => {
    await api.delete(`/api/cart/${itemId}`);
  },

  // Очистить корзину
  clearCart: async (): Promise<void> => {
    await api.delete('/api/cart/');
  },

  // Получить сводку корзины
  getCartSummary: async (): Promise<CartSummary> => {
    const response = await api.get<CartSummary>('/api/cart/summary');
    return response.data;
  },

  // Deprecated endpoints для совместимости
  getCartState: async (): Promise<CartStateOut> => {
    const response = await api.get<CartStateOut>('/api/cart/state');
    return response.data;
  },

  addToCartOld: async (variantId: number, quantity: number = 1): Promise<CartStateOut> => {
    const response = await api.post<CartStateOut>(`/api/cart/add/${variantId}?qty=${quantity}`);
    return response.data;
  },

  updateCartItemOld: async (variantId: number, quantity: number): Promise<CartStateOut> => {
    const response = await api.put<CartStateOut>(`/api/cart/update/${variantId}`, { quantity });
    return response.data;
  },

  removeFromCartOld: async (variantId: number): Promise<CartStateOut> => {
    const response = await api.delete<CartStateOut>(`/api/cart/remove/${variantId}`);
    return response.data;
  },

  clearCartOld: async (): Promise<CartStateOut> => {
    const response = await api.delete<CartStateOut>('/api/cart/clear/all');
    return response.data;
  },
}; 

