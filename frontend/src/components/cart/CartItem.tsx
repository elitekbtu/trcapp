import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, Clock, AlertCircle, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatPrice } from '../../utils/format';
import { formatReservationTime, isReservationExpired } from '../../utils/cart';
import type { CartItemWithActions } from '../../types/cart';

interface CartItemProps {
  item: CartItemWithActions;
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<void>;
  onRemove: (itemId: number) => Promise<void>;
  isCompact?: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isCompact = false,
}) => {
  const reservationTime = formatReservationTime(item.reserved_until);
  const isExpired = (item.is_reserved ?? false) && isReservationExpired(item.reserved_until);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      await onRemove(item.id);
    } else {
      await onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        border rounded-lg p-4 transition-all duration-200
        ${!(item.is_available ?? true) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
        ${isExpired ? 'bg-orange-50 border-orange-200' : ''}
        ${isCompact ? 'p-3' : 'p-4'}
      `}
    >
      <div className={`flex ${isCompact ? 'space-x-3' : 'space-x-4'}`}>
        {/* Изображение товара */}
        <div className={`
          bg-gray-100 rounded-lg overflow-hidden flex-shrink-0
          ${isCompact ? 'h-12 w-12' : 'h-16 w-16'}
        `}>
          {item.item.image_urls && item.item.image_urls.length > 0 ? (
            <img
              src={item.item.image_urls[0]}
              alt={item.item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <Package className={`text-gray-400 ${isCompact ? 'h-4 w-4' : 'h-6 w-6'}`} />
            </div>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-gray-900 truncate ${isCompact ? 'text-sm' : ''}`}>
                {item.item.name}
              </h4>
              <p className={`text-gray-500 truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {item.variant.display_name || ''}
              </p>
              {item.item.brand && (
                <p className={`text-gray-400 truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  {item.item.brand}
                </p>
              )}
            </div>
            
            {/* Цена */}
            <div className="text-right ml-2">
              <p className={`font-semibold text-gray-900 ${isCompact ? 'text-sm' : ''}`}>
                {formatPrice(item.subtotal ?? 0)}
              </p>
              {item.variant.actual_price && item.variant.discount_price && (
                <p className={`text-gray-500 line-through ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  {formatPrice(item.variant.actual_price * item.quantity)}
                </p>
              )}
            </div>
          </div>

          {/* Статусы и предупреждения */}
          <div className="space-y-1 mb-3">
            {!(item.is_available ?? true) && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium">Недоступен</span>
              </div>
            )}
            
            {(item.is_reserved ?? false) && reservationTime && (
              <div className={`flex items-center space-x-1 ${isExpired ? 'text-orange-600' : 'text-blue-600'}`}>
                <Clock className="h-3 w-3" />
                <span className="text-xs">{reservationTime}</span>
              </div>
            )}
            
            {item.quantity > (item.variant.available_stock ?? 0) && (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">Доступно только {item.variant.available_stock ?? 0} шт.</span>
              </div>
            )}
          </div>

          {/* Управление количеством */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size={isCompact ? "sm" : "md"}
                className={`${isCompact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}`}
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={!item.canDecrease || item.isUpdating}
              >
                <Minus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
              
              <span className={`
                font-medium text-center min-w-0
                ${isCompact ? 'text-sm px-2' : 'px-3'}
                ${item.isUpdating ? 'animate-pulse' : ''}
              `}>
                {item.quantity}
              </span>
              
              <Button
                variant="outline"
                size={isCompact ? "sm" : "md"}
                className={`${isCompact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}`}
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={!item.canIncrease || item.isUpdating}
              >
                <Plus className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </div>

            <Button
              variant="ghost"
              size={isCompact ? "sm" : "md"}
              className={`
                text-red-600 hover:text-red-700 hover:bg-red-50
                ${isCompact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}
              `}
              onClick={() => onRemove(item.id)}
              disabled={item.isUpdating}
            >
              <Trash2 className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
          </div>

          {/* Заметки */}
          {item.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              <span className="font-medium">Заметка:</span> {item.notes}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 