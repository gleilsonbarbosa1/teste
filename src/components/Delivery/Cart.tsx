import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Edit3 } from 'lucide-react';
import { CartItem } from '../../types/delivery';

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  totalPrice: number;
  disabled?: boolean;
  onEditItem?: (item: CartItem) => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
  disabled = false,
  onEditItem
}) => {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-96 sm:max-w-md h-full sm:h-auto sm:max-h-[80vh] sm:rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 sm:rounded-t-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Carrinho ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.product_name}</h3>
                      {item.selected_size && (
                        <p className="text-sm text-gray-600">Tamanho: {item.selected_size}</p>
                      )}
                      {item.complements.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">Complementos:</p>
                          {item.complements.map((comp, idx) => (
                            <p key={idx} className="text-xs text-gray-600 ml-2">
                              • {comp.name}
                              {comp.price > 0 && ` (+${formatPrice(comp.price)})`}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.observations && (
                        <p className="text-xs text-gray-600 mt-1">
                          Obs: {item.observations}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          disabled={disabled}
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        disabled={disabled}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                        disabled={disabled}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                        disabled={disabled}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {formatPrice(item.total_price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.unit_price)} cada
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white p-4 sm:rounded-b-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-gray-800">Total:</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(totalPrice)}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={onClearCart}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                disabled={disabled}
              >
                Limpar
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                disabled={disabled}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;