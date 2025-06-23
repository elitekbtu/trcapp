import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
// import { formatPrice } from '../../utils/format';
import { 
  calculateCartMetrics, 
  getCartRecommendations, 
  validateCartForCheckout,
  formatCartSummary 
} from '../../utils/cart';
import type { CartItem, CartSummary as CartSummaryType } from '../../types/cart';

interface CartSummaryProps {
  items: CartItem[];
  summary: CartSummaryType;
  onCheckout: () => void;
  onClearCart: () => void;
  isCheckoutLoading?: boolean;
  isClearingCart?: boolean;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  summary,
  onCheckout,
  onClearCart,
  isCheckoutLoading = false,
  isClearingCart = false,
  className = '',
}) => {
  const metrics = calculateCartMetrics(items);
  const recommendations = getCartRecommendations(items, summary);
  const validation = validateCartForCheckout(items, summary);
  const formattedSummary = formatCartSummary(summary);

  if (!(summary.total ?? 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          text-center py-8 px-4 bg-gray-50 rounded-lg
          ${className ? className : ''}
        `}
      >
        <ShoppingCart className={`mx-auto text-gray-400 mb-4 ${className ? className : 'h-16 w-16'}`} />
        <h3 className={`font-medium text-gray-900 mb-2 ${className ? 'text-lg' : 'text-xl'}`}>
          Корзина пуста
        </h3>
        <p className={`text-gray-500 ${className ? 'text-sm' : ''}`}>
          Добавьте товары, чтобы начать покупки
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-lg p-6 space-y-4 ${className}`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Итого</h3>
        <ShoppingCart className="h-5 w-5 text-gray-400" />
      </div>

      {/* Основная информация */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Товары</span>
          <span className="font-medium">{formattedSummary.itemsText}</span>
        </div>
        
        {metrics.reservedItems > 0 && (
          <div className="flex justify-between items-center text-blue-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Зарезервировано</span>
            </div>
            <span className="text-sm font-medium">{metrics.reservedItems}</span>
          </div>
        )}
        
        {metrics.unavailableItems > 0 && (
          <div className="flex justify-between items-center text-red-600">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Недоступно</span>
            </div>
            <span className="text-sm font-medium">{metrics.unavailableItems}</span>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Общая сумма</span>
            <span className="text-lg font-bold text-gray-900">
              {formattedSummary.totalFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Статус и рекомендации */}
      {(recommendations.length > 0 || !validation.isValid) && (
        <div className="space-y-2">
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-orange-700">{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {validation.isValid && recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {recommendations.map((rec, index) => (
                    <p key={index} className="text-sm text-blue-700">{rec}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Действия */}
      <div className="space-y-3 pt-2">
        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={!validation.isValid || isCheckoutLoading || (summary.total ?? 0) <= 0}
          isLoading={isCheckoutLoading}
        >
          {validation.isValid ? (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Оформить заказ</span>
              <span className="text-sm opacity-75">
                ({formattedSummary.totalFormatted})
              </span>
            </div>
          ) : (
            'Исправьте ошибки для продолжения'
          )}
        </Button>

        {items.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onClearCart}
            disabled={isClearingCart}
            isLoading={isClearingCart}
          >
            Очистить корзину
          </Button>
        )}
      </div>

      {/* Дополнительная информация */}
      {validation.isValid && (summary.total ?? 0) > 0 && (
        <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
          <p>• Резервирование товаров действует 30 минут</p>
          <p>• Цены могут измениться до оформления заказа</p>
          {metrics.reservedItems > 0 && (
            <p>• Зарезервированные товары гарантированы для вас</p>
          )}
        </div>
      )}
    </motion.div>
  );
}; 