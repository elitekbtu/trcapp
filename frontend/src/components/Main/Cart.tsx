import React, { useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { Button } from '../ui/Button';
import { CartDrawer } from '../../features/cart/CartDrawer';
import { formatPrice } from '../../utils/format';
import { calculateCartMetrics } from '../../utils/cart';

export const Cart: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { cart, isLoading } = useCart();

  const metrics = cart?.items ? calculateCartMetrics(cart.items) : null;
  const hasItems = cart?.items && cart.items.length > 0;
  const hasUnavailableItems = cart?.summary?.has_unavailable || false;

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      {/* Cart Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={openDrawer}
          className={`
            relative transition-all duration-200
            ${hasItems ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' : ''}
            ${hasUnavailableItems ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''}
          `}
          disabled={isLoading}
        >
          {isLoading ? (
            <Package className="h-5 w-5 animate-pulse" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          
          {/* Badge */}
          {hasItems && cart?.summary && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium
                flex items-center justify-center text-white
                ${hasUnavailableItems ? 'bg-red-500' : 'bg-blue-500'}
              `}
            >
              {(cart.summary.items_count ?? 0) > 99 ? '99+' : (cart.summary.items_count ?? 0)}
            </motion.div>
          )}
        </Button>

        {/* Hover Preview */}
        {hasItems && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            whileHover={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg p-4 z-10 pointer-events-none"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Товаров в корзине:</span>
                <span className="font-medium">{cart?.summary?.items_count || 0}</span>
              </div>
              
              {metrics && metrics.reservedItems > 0 && (
                <div className="flex items-center justify-between text-sm text-blue-600">
                  <span>Зарезервировано:</span>
                  <span className="font-medium">{metrics.reservedItems}</span>
                </div>
              )}
              
              {metrics && metrics.unavailableItems > 0 && (
                <div className="flex items-center justify-between text-sm text-red-600">
                  <span>Недоступно:</span>
                  <span className="font-medium">{metrics.unavailableItems}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold text-lg">
                    {cart?.summary ? formatPrice(cart.summary.total) : '0 ₽'}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center pt-1">
                Нажмите для открытия корзины
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}; 