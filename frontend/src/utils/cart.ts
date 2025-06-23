import type { 
  CartItemResponse, 
  CartSummary, 
  CartItemWithActions 
} from '../types/cart';
import { formatPrice } from './format';

/**
 * Вычисляет общую стоимость товаров в корзине
 */
export const calculateCartTotal = (items: CartItemResponse[]): number => {
  return items.reduce((total, item) => {
    return total + (item.subtotal ?? 0);
  }, 0);
};

/**
 * Вычисляет общее количество товаров в корзине
 */
export const calculateCartItemsCount = (items: CartItemResponse[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Группирует товары корзины по статусу доступности
 */
export const groupCartItemsByStatus = (items: CartItemResponse[]) => {
  return {
    available: items.filter(item => item.is_available ?? true),
    unavailable: items.filter(item => !(item.is_available ?? true)),
    reserved: items.filter(item => item.is_reserved ?? false),
  };
};

/**
 * Проверяет, истек ли срок резервирования товара
 */
export const isReservationExpired = (reservedUntil?: string): boolean => {
  if (!reservedUntil) return false;
  return new Date(reservedUntil) < new Date();
};

/**
 * Форматирует время резервирования для отображения
 */
export const formatReservationTime = (reservedUntil?: string): string | null => {
  if (!reservedUntil) return null;
  
  const reservationDate = new Date(reservedUntil);
  const now = new Date();
  const diffMs = reservationDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Резервирование истекло';
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffHours > 0) {
    return `Зарезервировано на ${diffHours} ч ${diffMinutes % 60} мин`;
  } else {
    return `Зарезервировано на ${diffMinutes} мин`;
  }
};

/**
 * Обогащает элементы корзины дополнительными действиями
 */
export const enrichCartItemsWithActions = (
  items: CartItemResponse[], 
  updatingItems: Set<number>
): CartItemWithActions[] => {
  return items.map(item => ({
    ...item,
    canIncrease: (item.variant.available_stock ?? 0) > item.quantity,
    canDecrease: item.quantity > 1,
    isUpdating: updatingItems.has(item.id)
  }));
};

/**
 * Вычисляет метрики корзины
 */
export const calculateCartMetrics = (items: CartItemResponse[], summary?: CartSummary) => {
  const totalValue = summary?.total ?? 0;
  const totalItems = summary?.total_items ?? 0;
  const uniqueItems = items.length;
  const averageItemPrice = uniqueItems > 0 ? totalValue / totalItems : 0;
  const reservedItems = items.filter(item => item.is_reserved ?? false).length;
  const unavailableItems = items.filter(item => !(item.is_available ?? true)).length;

  return {
    totalValue,
    totalItems,
    uniqueItems,
    averageItemPrice,
    reservedItems,
    unavailableItems,
  };
};

/**
 * Проверяет, можно ли увеличить количество товара
 */
export const canIncreaseQuantity = (item: CartItemResponse): boolean => {
  return (item.variant.available_stock ?? 0) > item.quantity;
};

/**
 * Проверяет, можно ли уменьшить количество товара
 */
export const canDecreaseQuantity = (item: CartItemResponse): boolean => {
  return item.quantity > 1;
};

/**
 * Получает максимально доступное количество для товара
 */
export const getMaxAvailableQuantity = (item: CartItemResponse): number => {
  return Math.max(item.variant.available_stock ?? 0, item.quantity);
};

/**
 * Форматирует цену для отображения
 */
export const formatCartPrice = (price: number | undefined): string => {
  if (price === undefined || price === null) return '0 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Проверяет, есть ли проблемы с товарами в корзине
 */
export const hasCartIssues = (items: CartItemResponse[]): boolean => {
  return items.some(item => 
    !(item.is_available ?? true) || 
    ((item.is_reserved ?? false) && isReservationExpired(item.reserved_until)) ||
    item.quantity > (item.variant.available_stock ?? 0)
  );
};

/**
 * Получает список проблемных товаров
 */
export const getProblematicItems = (items: CartItemResponse[]) => {
  return items.filter(item => 
    !(item.is_available ?? true) || 
    ((item.is_reserved ?? false) && isReservationExpired(item.reserved_until)) ||
    item.quantity > (item.variant.available_stock ?? 0)
  );
};

/**
 * Получение рекомендованных действий для корзины
 */
export const getCartRecommendations = (items: CartItemResponse[], summary: CartSummary) => {
  const recommendations: string[] = [];
  const metrics = calculateCartMetrics(items, summary);
  
  if (metrics.unavailableItems > 0) {
    recommendations.push(`Удалите ${metrics.unavailableItems} недоступных товаров`);
  }
  
  if (metrics.reservedItems > 0) {
    recommendations.push(`У вас ${metrics.reservedItems} зарезервированных товаров`);
  }
  
  const expiredItems = items.filter(item => 
    (item.is_reserved ?? false) && isReservationExpired(item.reserved_until)
  );
  
  if (expiredItems.length > 0) {
    recommendations.push(`Обновите ${expiredItems.length} товаров с истекшим резервированием`);
  }
  
  if ((summary.total ?? 0) > 0 && metrics.unavailableItems === 0) {
    recommendations.push('Корзина готова к оформлению заказа');
  }
  
  return recommendations;
};

/**
 * Валидация корзины перед оформлением заказа
 */
export const validateCartForCheckout = (items: CartItemResponse[], summary: CartSummary) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (items.length === 0) {
    errors.push('Корзина пуста');
    return { isValid: false, errors, warnings };
  }
  
  if (summary.has_unavailable) {
    errors.push('В корзине есть недоступные товары');
  }
  
  const expiredItems = items.filter(item => 
    (item.is_reserved ?? false) && isReservationExpired(item.reserved_until)
  );
  
  if (expiredItems.length > 0) {
    warnings.push(`У ${expiredItems.length} товаров истекло резервирование`);
  }
  
  const outOfStockItems = items.filter(item => 
    item.quantity > (item.variant.available_stock ?? 0)
  );
  
  if (outOfStockItems.length > 0) {
    errors.push('Превышено доступное количество для некоторых товаров');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Форматирование сводки корзины для отображения
 */
export const formatCartSummary = (summary: CartSummary) => {
  return {
    totalFormatted: formatPrice(summary.total ?? 0),
    itemsText: `${summary.items_count ?? 0} ${getItemsText(summary.items_count ?? 0)}`,
    statusText: (summary.has_unavailable ?? false) ? 'Есть недоступные товары' : 'Все товары доступны',
  };
};

/**
 * Склонение слова "товар"
 */
const getItemsText = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'товаров';
  }
  
  if (lastDigit === 1) return 'товар';
  if (lastDigit >= 2 && lastDigit <= 4) return 'товара';
  return 'товаров';
}; 