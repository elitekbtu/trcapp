import React, { useState } from 'react';
import { ShoppingCart, Plus, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { useCart } from '../../hooks/useCart';
import { useNotification } from '../notifications/NotificationProvider';

interface AddToCartButtonProps {
  variantId: number;
  quantity?: number;
  notes?: string;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  variantId,
  quantity = 1,
  notes,
  disabled = false,
  showQuantitySelector = false,
  variant = 'primary',
  size = 'md',
  className = '',
  onSuccess,
  onError,
}) => {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { addNotification } = useNotification();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(quantity);
  const [showSuccess, setShowSuccess] = useState(false);

  const inCart = isInCart(variantId);
  const currentQuantity = getItemQuantity(variantId);

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    
    try {
      await addToCart({
        variant_id: variantId,
        quantity: selectedQuantity,
        notes,
      });

      // Показываем успешное состояние
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      addNotification({
        type: 'success',
        title: 'Товар добавлен в корзину',
        message: `Количество: ${selectedQuantity}`,
        duration: 3000,
        action: {
          label: 'Открыть корзину',
          onClick: () => {
            // TODO: Open cart drawer
            console.log('Open cart');
          },
        },
      });

      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Не удалось добавить товар в корзину';
      
      addNotification({
        type: 'error',
        title: 'Ошибка добавления',
        message: errorMessage,
      });

      onError?.(error);
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    setSelectedQuantity(prev => Math.min(prev + 1, 99));
  };

  const decrementQuantity = () => {
    setSelectedQuantity(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Quantity Selector */}
      {showQuantitySelector && (
        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={decrementQuantity}
            disabled={selectedQuantity <= 1 || isAdding}
            className="h-8 w-8 p-0 rounded-none"
          >
            <Plus className="h-3 w-3 rotate-45" />
          </Button>
          <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
            {selectedQuantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={incrementQuantity}
            disabled={selectedQuantity >= 99 || isAdding}
            className="h-8 w-8 p-0 rounded-none"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Add to Cart Button */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className="relative"
      >
        <Button
          variant={variant}
          size={size}
          onClick={handleAddToCart}
          disabled={disabled || isAdding}
          isLoading={isAdding}
          className={`
            relative overflow-hidden transition-all duration-200
            ${inCart ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
            ${showSuccess ? 'bg-green-500 text-white' : ''}
          `}
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Добавлено!</span>
              </motion.div>
            ) : isAdding ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Добавление...</span>
              </motion.div>
            ) : inCart ? (
              <motion.div
                key="in-cart"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>В корзине ({currentQuantity})</span>
              </motion.div>
            ) : disabled ? (
              <motion.div
                key="disabled"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Недоступно</span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>
                  {showQuantitySelector && selectedQuantity > 1
                    ? `Добавить ${selectedQuantity} шт.`
                    : 'В корзину'
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Success Ripple Effect */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-green-400 rounded-lg pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 