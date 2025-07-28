import React, { useState } from 'react';
import { X, Search, Plus, Scale } from 'lucide-react';
import { TableCartItem } from '../../types/table-sales';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: TableCartItem) => void;
  storeId: 1 | 2;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  storeId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Produtos de demonstração
  const demoProducts = [
    {
      code: 'ACAI300',
      name: 'Açaí 300ml',
      unit_price: 15.90,
      is_weighable: false
    },
    {
      code: 'ACAI500',
      name: 'Açaí 500ml',
      unit_price: 22.90,
      is_weighable: false
    },
    {
      code: 'ACAI1KG',
      name: 'Açaí 1kg (Pesável)',
      price_per_gram: 0.04499,
      is_weighable: true
    },
    {
      code: 'MILK400',
      name: 'Milkshake 400ml',
      unit_price: 11.99,
      is_weighable: false
    }
  ];

  const filteredProducts = searchTerm
    ? demoProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : demoProducts;

  const calculateSubtotal = () => {
    if (!selectedProduct) return 0;
    
    if (selectedProduct.is_weighable && weight && selectedProduct.price_per_gram) {
      return weight * 1000 * selectedProduct.price_per_gram;
    } else if (!selectedProduct.is_weighable && selectedProduct.unit_price) {
      return quantity * selectedProduct.unit_price;
    }
    
    return 0;
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const item: TableCartItem = {
      product_code: selectedProduct.code,
      product_name: selectedProduct.name,
      quantity: selectedProduct.is_weighable ? 1 : quantity,
      weight: selectedProduct.is_weighable ? weight : undefined,
      unit_price: selectedProduct.unit_price,
      price_per_gram: selectedProduct.price_per_gram,
      subtotal: calculateSubtotal(),
      notes: notes || undefined
    };

    onAddItem(item);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setWeight(undefined);
    setNotes('');
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Adicionar Item - Loja {storeId}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Busca de Produtos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Produto
            </label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome ou código do produto..."
              />
            </div>
          </div>

          {/* Lista de Produtos */}
          {searchTerm && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.map((product) => (
                <button
                  key={product.code}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedProduct?.code === product.code ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-600">Código: {product.code}</p>
                    </div>
                    <div className="text-right">
                      {product.is_weighable ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Scale size={16} />
                          <span className="font-medium">
                            R$ {(product.price_per_gram * 1000).toFixed(2)}/kg
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-green-600">
                          R$ {product.unit_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Produto Selecionado */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3">Produto Selecionado</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{selectedProduct.name}</h4>
                    <p className="text-sm text-gray-600">Código: {selectedProduct.code}</p>
                  </div>
                  {selectedProduct.is_weighable && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Scale size={16} />
                      <span>Produto pesável</span>
                    </div>
                  )}
                </div>

                {/* Quantidade ou Peso */}
                {selectedProduct.is_weighable ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={weight || ''}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Ex: Sem açúcar, mais granola..."
                  />
                </div>

                {/* Subtotal */}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="text-xl font-bold text-green-600">
                      R$ {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddItem}
            disabled={!selectedProduct || (selectedProduct.is_weighable && !weight) || calculateSubtotal() <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Adicionar Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;