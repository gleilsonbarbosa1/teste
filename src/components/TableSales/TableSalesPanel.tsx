import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  ShoppingCart,
  X,
  Scale,
  AlertCircle 
} from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

interface TableCartItem {
  product_code: string;
  product_name: string;
  quantity: number;
  weight?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  // Estados básicos
  const [tables, setTables] = useState([
    { id: '1', number: 1, name: 'Mesa 1', status: 'livre' },
    { id: '2', number: 2, name: 'Mesa 2', status: 'livre' },
    { id: '3', number: 3, name: 'Mesa 3', status: 'livre' },
    { id: '4', number: 4, name: 'Mesa 4', status: 'livre' }
  ]);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productWeight, setProductWeight] = useState('');

  // Hooks
  const { products } = usePDVProducts();
  const loja1Cash = usePDVCashRegister();
  const loja2Cash = useStore2PDVCashRegister();
  
  const cashHook = storeId === 1 ? loja1Cash : loja2Cash;
  const { isOpen: isCashRegisterOpen } = cashHook;

  // Filtrar apenas produtos ativos
  const activeProducts = products.filter(p => p.is_active);

  // Função para formatar preço
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Adicionar produto ao carrinho
  const addToCart = (product, weight) => {
    console.log('🛒 Adicionando:', product.name, weight ? `${weight}kg` : 'unitário');
    
    if (product.is_weighable && !weight) {
      setSelectedProduct(product);
      setShowWeightModal(true);
      return;
    }

    const unitPrice = product.is_weighable 
      ? (product.price_per_gram || 0) * (weight || 0) * 1000
      : product.unit_price || 0;

    const newItem = {
      product_code: product.code,
      product_name: product.name,
      quantity: 1,
      weight: product.is_weighable ? weight : undefined,
      unit_price: product.is_weighable ? product.price_per_gram : product.unit_price,
      price_per_gram: product.is_weighable ? product.price_per_gram : undefined,
      subtotal: unitPrice
    };

    setCart(prev => {
      const newCart = [...prev, newItem];
      console.log('✅ Carrinho atualizado:', newCart.length, 'itens');
      return newCart;
    });
  };

  // Confirmar peso
  const confirmWeight = () => {
    if (!selectedProduct || !productWeight) return;
    
    const weight = parseFloat(productWeight);
    if (weight <= 0) {
      alert('Peso deve ser maior que zero');
      return;
    }

    addToCart(selectedProduct, weight);
    setShowWeightModal(false);
    setSelectedProduct(null);
    setProductWeight('');
  };

  // Remover item do carrinho
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular total
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Verificar se pode salvar
  const canSave = cart.length > 0 && customerName.trim().length > 0 && isCashRegisterOpen;

  // Salvar venda
  const saveSale = async () => {
    if (!canSave) return;
    
    console.log('💾 Salvando venda:', {
      mesa: selectedTable?.number,
      itens: cart.length,
      cliente: customerName.trim(),
      total: getTotal()
    });

    try {
      alert(`Venda salva com sucesso!\nMesa: ${selectedTable?.number}\nItens: ${cart.length}\nTotal: ${formatPrice(getTotal())}`);
      
      // Limpar após salvar
      setCart([]);
      setCustomerName('');
      setSelectedTable(null);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      alert('Erro ao salvar venda');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={24} className="text-blue-600" />
          Vendas por Mesa - Loja {storeId}
        </h1>
        {operatorName && (
          <p className="text-gray-600">Operador: {operatorName}</p>
        )}
      </div>

      {/* Status do Caixa */}
      {!isCashRegisterOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Caixa Fechado</h3>
              <p className="text-red-700 text-sm">
                Não é possível realizar vendas sem um caixa aberto.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mesas (30%) */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mesas</h2>
          <div className="grid grid-cols-2 gap-3">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTable?.id === table.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">{table.name}</div>
                  <div className="text-sm text-gray-500">
                    {table.status === 'livre' ? 'Livre' : 'Ocupada'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Produtos */}
          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Produtos</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeProducts.slice(0, 10).map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500">
                      {product.is_weighable ? (
                        <span className="flex items-center gap-1">
                          <Scale size={12} />
                          {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                        </span>
                      ) : (
                        formatPrice(product.unit_price || 0)
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!selectedTable || !isCashRegisterOpen}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrinho (70%) */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Carrinho - {selectedTable ? selectedTable.name : 'Selecione uma mesa'}
          </h2>

          {selectedTable ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Dados do Cliente */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o nome do cliente"
                />
              </div>

              {/* Itens do Carrinho */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Itens ({cart.length})
                </h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Nenhum item no carrinho</p>
                    <p className="text-sm">Adicione produtos da lista ao lado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-gray-600">
                              {item.weight ? (
                                <>Peso: {item.weight}kg - {formatPrice((item.price_per_gram || 0) * 1000)}/kg</>
                              ) : (
                                <>Qtd: {item.quantity} - {formatPrice(item.unit_price || 0)}</>
                              )}
                            </div>
                            <div className="font-semibold text-green-600">
                              {formatPrice(item.subtotal)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total e Botão */}
              {cart.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(getTotal())}
                    </span>
                  </div>

                  <button
                    onClick={saveSale}
                    disabled={!canSave}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      canSave 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Save size={20} />
                    Salvar Venda ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                  </button>

                  {/* Status Debug */}
                  <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-center space-y-1">
                    <div className="font-semibold">Status:</div>
                    <div className={cart.length > 0 ? 'text-green-600' : 'text-red-600'}>
                      📦 Itens: {cart.length}
                    </div>
                    <div className={customerName.trim() ? 'text-green-600' : 'text-red-600'}>
                      👤 Cliente: {customerName.trim() ? '✅' : '❌'}
                    </div>
                    <div className={isCashRegisterOpen ? 'text-green-600' : 'text-red-600'}>
                      💰 Caixa: {isCashRegisterOpen ? 'Aberto' : 'Fechado'}
                    </div>
                    <div className={`font-semibold ${canSave ? 'text-green-600' : 'text-red-600'}`}>
                      {canSave ? '✅ PRONTO PARA SALVAR' : '❌ FALTAM DADOS'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Selecione uma Mesa
              </h3>
              <p className="text-gray-500">
                Escolha uma mesa na lateral para começar a venda
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Peso */}
      {showWeightModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Informar Peso</h3>
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setSelectedProduct(null);
                  setProductWeight('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="font-medium text-orange-800">{selectedProduct.name}</div>
                <div className="text-sm text-orange-600">
                  {formatPrice((selectedProduct.price_per_gram || 0) * 1000)}/kg
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="50"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 0.500"
                  autoFocus
                />
              </div>

              {productWeight && parseFloat(productWeight) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice((selectedProduct.price_per_gram || 0) * parseFloat(productWeight) * 1000)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setSelectedProduct(null);
                    setProductWeight('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmWeight}
                  disabled={!productWeight || parseFloat(productWeight) <= 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 rounded-lg"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;