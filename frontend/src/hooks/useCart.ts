import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import type { CartResponse, CartItemCreate, CartItemUpdate } from '../types/cart';

export const useCart = () => {
  const queryClient = useQueryClient();

  // Получение корзины
  const {
    data: cart,
    isLoading,
    error,
    refetch,
  } = useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // Добавление товара в корзину
  const addToCartMutation = useMutation({
    mutationFn: (data: CartItemCreate) => cartApi.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
    },
  });

  // Обновление товара в корзине
  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: CartItemUpdate }) =>
      cartApi.updateCartItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error updating cart item:', error);
    },
  });

  // Удаление товара из корзины
  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error removing from cart:', error);
    },
  });

  // Очистка корзины
  const clearCartMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error clearing cart:', error);
    },
  });

  // Вспомогательные функции
  const addToCart = async (data: CartItemCreate) => {
    return addToCartMutation.mutateAsync(data);
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    return updateQuantityMutation.mutateAsync({
      itemId,
      data: { quantity },
    });
  };

  const updateCartItem = async (itemId: number, data: CartItemUpdate) => {
    return updateQuantityMutation.mutateAsync({ itemId, data });
  };

  const removeItem = async (itemId: number) => {
    return removeItemMutation.mutateAsync(itemId);
  };

  const clearCart = async () => {
    return clearCartMutation.mutateAsync();
  };

  // Проверка, есть ли товар в корзине (по variant_id)
  const isInCart = (variantId: number): boolean => {
    return cart?.items?.some(item => item.variant_id === variantId) || false;
  };

  // Получение количества товара в корзине (по variant_id)
  const getItemQuantity = (variantId: number): number => {
    const item = cart?.items?.find(item => item.variant_id === variantId);
    return item?.quantity || 0;
  };

  // Получение элемента корзины по variant_id
  const getCartItem = (variantId: number) => {
    return cart?.items?.find(item => item.variant_id === variantId);
  };

  // Вычисляемые значения
  const totalItems = cart?.summary?.items_count || 0;
  const totalPrice = cart?.summary?.total || 0;
  const hasItems = totalItems > 0;
  const hasUnavailableItems = cart?.summary?.has_unavailable || false;

  // Статусы мутаций
  const isAdding = addToCartMutation.isPending;
  const isUpdating = updateQuantityMutation.isPending;
  const isRemoving = removeItemMutation.isPending;
  const isClearing = clearCartMutation.isPending;

  // Общий статус загрузки для любых операций
  const isOperating = isAdding || isUpdating || isRemoving || isClearing;

  return {
    // Данные
    cart,
    totalItems,
    totalPrice,
    hasItems,
    hasUnavailableItems,

    // Состояния
    isLoading,
    isAdding,
    isUpdating,
    isRemoving,
    isClearing,
    isOperating,
    error,

    // Методы
    addToCart,
    updateQuantity,
    updateCartItem,
    removeItem,
    clearCart,
    refetch,

    // Утилиты
    isInCart,
    getItemQuantity,
    getCartItem,

    // Мутации (для продвинутого использования)
    addToCartMutation,
    updateQuantityMutation,
    removeItemMutation,
    clearCartMutation,
  };
}; 