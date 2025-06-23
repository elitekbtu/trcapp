import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { enrichCartItemsWithActions, groupCartItemsByStatus } from '../../utils/cart';
import { useNotification } from '../../components/notifications/NotificationProvider';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    // isUpdating,
    // isRemoving,
    isClearing,
  } = useCart();

  const { addNotification } = useNotification();
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  // Автоматическое обновление времени резервирования
  useEffect(() => {
    if (!cart?.items) return;

    const interval = setInterval(() => {
      // Принудительное обновление компонента для пересчета времени резервирования
      setUpdatingItems(new Set());
    }, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, [cart?.items]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateQuantity(itemId, newQuantity);
      addNotification({
        type: 'success',
        title: 'Количество обновлено',
        duration: 2000,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: error.response?.data?.detail || 'Не удалось обновить количество',
      });
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    const item = cart?.items.find(i => i.id === itemId);
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await removeItem(itemId);
      addNotification({
        type: 'info',
        title: 'Товар удален',
        message: item ? `${item.item.name} удален из корзины` : 'Товар удален из корзины',
        action: {
          label: 'Отменить',
          onClick: () => {
            // TODO: Implement undo functionality
            console.log('Undo remove');
          },
        },
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Ошибка удаления',
        message: error.response?.data?.detail || 'Не удалось удалить товар',
      });
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить корзину?')) return;
    
    try {
      await clearCart();
      addNotification({
        type: 'info',
        title: 'Корзина очищена',
        duration: 3000,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось очистить корзину',
      });
    }
  };

  const handleCheckout = () => {
    // TODO: Implement checkout functionality
    addNotification({
      type: 'info',
      title: 'Функция в разработке',
      message: 'Оформление заказа будет доступно в ближайшее время',
    });
  };

  if (isLoading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4">
                  <h2 className="text-lg font-semibold">Корзина</h2>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 p-4">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const enrichedItems = cart?.items ? enrichCartItemsWithActions(cart.items, updatingItems) : [];
  const groupedItems = groupCartItemsByStatus(cart?.items || []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Корзина</h2>
                {cart?.summary && (
                  <span className="text-sm text-gray-500">
                    ({cart.summary.items_count ?? 0})
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!cart || !cart.items || cart.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Корзина пуста
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Добавьте товары, чтобы начать покупки
                  </p>
                  <Button onClick={onClose}>
                    Продолжить покупки
                  </Button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Недоступные товары */}
                    {groupedItems.unavailable.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-red-600 flex items-center space-x-1">
                          <span>Недоступные товары</span>
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            {groupedItems.unavailable.length}
                          </span>
                        </h4>
                        {groupedItems.unavailable.map((item) => {
                          const enrichedItem = enrichedItems.find(e => e.id === item.id);
                          return enrichedItem ? (
                            <CartItem
                              key={item.id}
                              item={enrichedItem}
                              onUpdateQuantity={handleUpdateQuantity}
                              onRemove={handleRemoveItem}
                              isCompact
                            />
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Доступные товары */}
                    {groupedItems.available.length > 0 && (
                      <div className="space-y-3">
                        {groupedItems.unavailable.length > 0 && (
                          <h4 className="text-sm font-medium text-green-600 flex items-center space-x-1">
                            <span>Доступные товары</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {groupedItems.available.length}
                            </span>
                          </h4>
                        )}
                        {groupedItems.available.map((item) => {
                          const enrichedItem = enrichedItems.find(e => e.id === item.id);
                          return enrichedItem ? (
                            <CartItem
                              key={item.id}
                              item={enrichedItem}
                              onUpdateQuantity={handleUpdateQuantity}
                              onRemove={handleRemoveItem}
                              isCompact
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="flex-shrink-0 border-t p-4">
                    <CartSummary
                      items={cart.items}
                      summary={cart.summary}
                      onCheckout={handleCheckout}
                      onClearCart={handleClearCart}
                      isClearingCart={isClearing}
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 