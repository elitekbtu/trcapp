// Импортируем типы из схем API
import type {
  CartItemCreate as _CartItemCreate,
  CartItemUpdate as _CartItemUpdate,
  VariantInfo as _VariantInfo,
  ItemInfo as _ItemInfo,
  CartItemResponse as _CartItemResponse,
  CartSummary as _CartSummary,
  CartResponse as _CartResponse,
  CartItemOut as _CartItemOut,
  CartStateOut as _CartStateOut
} from '../api/schemas';

// Экспортируем типы
export type CartItemCreate = _CartItemCreate;
export type CartItemUpdate = _CartItemUpdate;
export type VariantInfo = _VariantInfo;
export type ItemInfo = _ItemInfo;
export type CartItemResponse = _CartItemResponse;
export type CartSummary = _CartSummary;
export type CartResponse = _CartResponse;
export type CartItemOut = _CartItemOut;
export type CartStateOut = _CartStateOut;

// Экспортируем CartItem как псевдоним для CartItemResponse для совместимости
export type CartItem = CartItemResponse;

// Типы для уведомлений корзины
export interface CartNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Типы для состояния корзины
export interface CartState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Дополнительные утилитарные типы
export interface CartItemWithActions extends CartItemResponse {
  canIncrease: boolean;
  canDecrease: boolean;
  isUpdating: boolean;
}

export interface CartMetrics {
  totalValue: number;
  totalItems: number;
  uniqueItems: number;
  averageItemPrice: number;
  reservedItems: number;
  unavailableItems: number;
} 