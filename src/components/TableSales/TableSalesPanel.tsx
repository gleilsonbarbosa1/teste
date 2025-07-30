import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Minus, 
  Save, 
  Trash2, 
  Package, 
  Scale,
  X,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

interface CartItem {
  id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productWeight, setProductWeight] = useState('');

  // Hooks
  const { products } = usePDVProducts();
  const loja1Cash = usePDVCashRegister();
  const loja2Cash = useStore2PDVCashRegister();
  
  const cashHook = storeId === 1 ? loja1Cash : loja2Cash;
  const { isOpen: isCashRegisterOpen } = cashHook;

  // Mesas fixas para demonstração
  const tables = [
    { id: 1, number: 1, name: 'Mesa 1', capacity: 4, status: 'livre' },
    { id: 2, number: 2, name: 'Mesa 2', capacity: 6, status: 'livre' },
    { id: 3, number: 3, name: 'Mesa 3', capacity: 2, status: 'livre' },
    { id: 4, number: 4, name: 'Mesa 4', capacity: 8, status: 'livre' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const addToCart = (product: any, weight?: number) => {
    if (product.is_weighable && !weight) {
      setSelectedProduct(product);
      setShowWeightModal(true);
      return;
    }

    const unitPrice = product.is_weighable 
      ? (product.price_per_gram || 0) * (weight || 0) * 1000
      : product.unit_price || 0;

    const newItem: CartItem = {
      id: Date.now().toString(),
      product_code: product.code,
      product_name: product.name,
      quantity: 1,
      weight: product.is_weighable ? weight : undefined,
      unit_price: product.is_weighable ? product.price_per_gram : product.unit_price,
      price_per_gram: product.is_weighable ? product.price_per_gram : undefined,
      subtotal: unitPrice
    };

    setCart(prev => [...prev, newItem]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

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

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim()) {
      alert('Preencha todos os dados obrigatórios');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível realizar vendas sem um caixa aberto');
      return;
    }

    // Simular salvamento
    const saleData = {
      table: selectedTable,
      customer: customerName,
      items: cart,
      total: getCartTotal(),
      store: storeId
    };

    console.log('Salvando venda:', saleData);
    alert('Venda salva com sucesso!');
    
    // Limpar após salvar
    setCart([]);
    setCustomerName('');
    setCustomerCount(1);
  };

  const canSave = cart.length > 0 && customerName.trim().length > 0 && isCashRegisterOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users size={28} className="text-indigo-600" />
            Vendas por Mesa - Loja {storeId}
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie vendas presenciais por mesa
            {operatorName && ` - Operador: ${operatorName}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Mesas e Produtos */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mesas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                Mesas
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTable?.id === table.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{table.name}</div>
                    <div className="text-sm opacity-75">{table.capacity} pessoas</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-green-600" />
                Produtos
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        {product.is_weighable ? (
                          <div className="flex items-center gap-1">
                            <Scale size={14} />
                            {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                          </div>
                        ) : (
                          formatPrice(product.unit_price || 0)
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!selectedTable}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Carrinho */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-purple-600" />
                  Carrinho de Vendas
                  {selectedTable && (
                    <span className="text-purple-600">- {selectedTable.name}</span>
                  )}
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {!selectedTable ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Selecione uma mesa para iniciar a venda</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dados do Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Pessoas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customerCount}
                        onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Itens do Carrinho */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Itens da Venda ({cart.length})
                    </h3>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">Adicione produtos ao carrinho</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{item.product_name}</div>
                              <div className="text-sm text-gray-600">
                                Qtd: {item.quantity}
                                {item.weight && ` | Peso: ${item.weight}kg`}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-600">
                                {formatPrice(item.subtotal)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total e Salvar */}
                  {cart.length > 0 && (
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(getCartTotal())}
                        </span>
                      </div>

                      <button
                        onClick={saveSale}
                        disabled={!canSave}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        Salvar Venda ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                      </button>
                      
                      {/* Status Debug */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <span>Itens no carrinho:</span>
                          <span className={cart.length > 0 ? 'text-green-600' : 'text-red-600'}>
                            {cart.length > 0 ? '✅' : '❌'} {cart.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Nome do cliente:</span>
                          <span className={customerName.trim() ? 'text-green-600' : 'text-red-600'}>
                            {customerName.trim() ? '✅' : '❌'} {customerName.trim() || 'Vazio'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Caixa da Loja {storeId}:</span>
                          <span className={isCashRegisterOpen ? 'text-green-600' : 'text-red-600'}>
                            {isCashRegisterOpen ? '✅ Aberto' : '❌ Fechado'}
                          </span>
                        </div>
                        <div className="pt-2 border-t mt-2">
                          <div className="text-center font-semibold">
                            Status: <span className={canSave ? 'text-green-600' : 'text-red-600'}>
                              {canSave ? '✅ PRONTO PARA SALVAR' : '❌ FALTAM DADOS'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Peso */}
      {showWeightModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scale size={20} className="text-orange-500" />
                Informar Peso
              </h3>
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
                <div className="font-medium text-orange-800">
                  {selectedProduct.name}
                </div>
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
                  placeholder="Ex: 0.500"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
              </div>

              {productWeight && parseFloat(productWeight) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice((selectedProduct.price_per_gram || 0) * parseFloat(productWeight) * 1000)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setSelectedProduct(null);
                  setProductWeight('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmWeight}
                disabled={!productWeight || parseFloat(productWeight) <= 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 rounded-lg transition-colors"
              >
                Confirmar Peso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;