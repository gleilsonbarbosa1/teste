import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, X, Scale, Package, DollarSign, ShoppingBag } from 'lucide-react';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { PDVProduct } from '../../types/pdv';

interface TableCartItem {
  product_code: string;
  product_name: string;
  quantity: number;
  weight?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
  notes?: string;
}

interface RestaurantTable {
  id: number;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
}

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId = 1, operatorName }) => {
  console.log('🏪 TableSalesPanel iniciado para Loja:', storeId);

  // Estados principais
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [saving, setSaving] = useState(false);

  // Estados das mesas
  const [tables, setTables] = useState<RestaurantTable[]>([
    { id: 1, number: 1, name: 'Mesa 1', capacity: 4, status: 'livre' },
    { id: 2, number: 2, name: 'Mesa 2', capacity: 6, status: 'livre' },
    { id: 3, number: 3, name: 'Mesa 3', capacity: 2, status: 'livre' },
    { id: 4, number: 4, name: 'Mesa 4', capacity: 8, status: 'livre' }
  ]);

  // Estados de modais
  const [showAddTable, setShowAddTable] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<PDVProduct | null>(null);
  const [productWeight, setProductWeight] = useState('');

  // Estados para nova mesa
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Hooks para produtos e caixa
  const { products } = usePDVProducts();
  const loja1CashRegister = usePDVCashRegister();
  const loja2CashRegister = useStore2PDVCashRegister();
  
  // Selecionar hook correto baseado na loja
  const cashRegisterHook = storeId === 1 ? loja1CashRegister : loja2CashRegister;
  const { isOpen: isCashRegisterOpen, currentRegister, addCashEntry } = cashRegisterHook;

  console.log('💰 Status do caixa Loja', storeId, ':', { 
    isOpen: isCashRegisterOpen, 
    registerId: currentRegister?.id 
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Adicionar produto ao carrinho
  const addToCart = (product: PDVProduct, weight?: number) => {
    console.log('🛒 Adicionando produto:', product.name);
    
    if (product.is_weighable && !weight) {
      setSelectedProductForWeight(product);
      setShowWeightModal(true);
      return;
    }

    const quantity = 1;
    const unitPrice = product.is_weighable 
      ? (product.price_per_gram || 0) * (weight || 0) * 1000
      : product.unit_price || 0;

    const newItem: TableCartItem = {
      product_code: product.code,
      product_name: product.name,
      quantity,
      weight: product.is_weighable ? weight : undefined,
      unit_price: product.is_weighable ? product.price_per_gram : product.unit_price,
      price_per_gram: product.is_weighable ? product.price_per_gram : undefined,
      subtotal: unitPrice * quantity
    };

    setCart(prev => {
      const newCart = [...prev, newItem];
      console.log('✅ Item adicionado:', newItem);
      return newCart;
    });
  };

  // Confirmar peso
  const confirmWeight = () => {
    if (!selectedProductForWeight || !productWeight) return;
    
    const weight = parseFloat(productWeight);
    if (weight <= 0) {
      alert('Peso deve ser maior que zero');
      return;
    }

    addToCart(selectedProductForWeight, weight);
    setShowWeightModal(false);
    setSelectedProductForWeight(null);
    setProductWeight('');
  };

  // Remover item do carrinho
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Adicionar nova mesa
  const addTable = () => {
    if (!newTableNumber || !newTableName) {
      alert('Preencha número e nome da mesa');
      return;
    }

    const tableNumber = parseInt(newTableNumber);
    if (tables.some(t => t.number === tableNumber)) {
      alert('Já existe uma mesa com este número');
      return;
    }

    const newTable: RestaurantTable = {
      id: Date.now(),
      number: tableNumber,
      name: newTableName,
      capacity: newTableCapacity,
      status: 'livre'
    };

    setTables(prev => [...prev, newTable]);
    setShowAddTable(false);
    setNewTableNumber('');
    setNewTableName('');
    setNewTableCapacity(4);
  };

  // Excluir mesa
  const deleteTable = (tableId: number) => {
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
      setCart([]);
      setCustomerName('');
    }
    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  // Alterar status da mesa
  const changeTableStatus = (tableId: number, newStatus: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza') => {
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, status: newStatus } : t
    ));
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguard. Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  // Salvar venda no caixa
  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim() || !isCashRegisterOpen) {
      console.log('❌ Validação de venda falhou:', {
        mesa: !!selectedTable,
        itens: cart.length,
        cliente: customerName.trim(),
        caixa: isCashRegisterOpen
      });
      return;
    }

    setSaving(true);
    console.log('💾 Salvando venda na mesa:', selectedTable.number);

    try {
      const total = getCartTotal();
      const description = `Venda Mesa ${selectedTable.number} - ${customerName} (${cart.length} itens) - Loja ${storeId}`;
      
      // Adicionar entrada no caixa
      await addCashEntry({
        type: 'income',
        amount: total,
        description: description,
        payment_method: 'dinheiro'
      });

      console.log('✅ Venda salva no caixa:', {
        mesa: selectedTable.number,
        valor: total,
        itens: cart.length,
        loja: storeId
      });

      // Alterar status da mesa para ocupada
      changeTableStatus(selectedTable.id, 'ocupada');

      // Limpar carrinho e dados
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);

      // Feedback visual
      alert(`Venda da Mesa ${selectedTable.number} salva com sucesso!\nValor: ${formatPrice(total)}`);

    } catch (error) {
      console.error('❌ Erro ao salvar venda:', error);
      alert('Erro ao salvar venda. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Verificar se pode salvar
  const canSave = cart.length > 0 && customerName.trim().length > 0 && isCashRegisterOpen && !saving;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-100 rounded-full p-2">
                  <Users size={24} className="text-indigo-600" />
                </div>
                Vendas por Mesa - Loja {storeId}
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie vendas presenciais por mesa
              </p>
            </div>
            {operatorName && (
              <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-indigo-700">
                  👤 Operador: <strong>{operatorName}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar - Mesas e Produtos */}
          <div className="space-y-6">
            {/* Mesas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Mesas ({tables.length})
                </h2>
                <button
                  onClick={() => setShowAddTable(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-all hover:scale-105"
                  title="Adicionar Mesa"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTable?.id === table.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedTable(table)}
                        className="flex-1 text-left"
                      >
                        <div className="font-semibold text-gray-800">🍽️ {table.name}</div>
                        <div className="text-sm text-gray-600">👥 {table.capacity} pessoas</div>
                      </button>
                      <button
                        onClick={() => deleteTable(table.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                        title="Excluir Mesa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <select
                        value={table.status}
                        onChange={(e) => changeTableStatus(table.id, e.target.value as any)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="livre">🟢 Livre</option>
                        <option value="ocupada">🔴 Ocupada</option>
                        <option value="aguardando_conta">🟡 Aguard. Conta</option>
                        <option value="limpeza">🔵 Limpeza</option>
                      </select>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(table.status)}`}>
                        {getStatusLabel(table.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Produtos */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-green-600" />
                Produtos ({products.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={!selectedTable}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {product.is_weighable ? (
                            <>
                              <Scale size={12} />
                              {formatPrice((product.price_per_gram || 0) * 1000)}/kg
                            </>
                          ) : (
                            formatPrice(product.unit_price || 0)
                          )}
                        </div>
                      </div>
                      <Plus size={16} className="text-green-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho - 3/4 da tela */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingBag size={24} className="text-purple-600" />
                  {selectedTable ? `Carrinho - ${selectedTable.name}` : 'Selecione uma Mesa'}
                </h2>
                {selectedTable && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTable.status)}`}>
                    {getStatusLabel(selectedTable.status)}
                  </div>
                )}
              </div>

              {!selectedTable ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Selecione uma Mesa
                  </h3>
                  <p className="text-gray-500">
                    Escolha uma mesa na barra lateral para começar uma venda
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dados do Cliente */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Dados do Cliente</h3>
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
                  </div>

                  {/* Itens do Carrinho */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🛒 Itens ({cart.length})</h3>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="bg-white rounded-lg p-6">
                          <ShoppingBag size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Carrinho vazio</p>
                          <p className="text-sm text-gray-400">Adicione produtos da lista à esquerda</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {cart.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{item.product_name}</div>
                                <div className="text-sm text-gray-600">
                                  {item.weight ? (
                                    <span className="flex items-center gap-1">
                                      <Scale size={12} />
                                      {item.weight}kg × {formatPrice((item.price_per_gram || 0) * 1000)}/kg
                                    </span>
                                  ) : (
                                    `${item.quantity}x ${formatPrice(item.unit_price || 0)}`
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-green-600">
                                  {formatPrice(item.subtotal)}
                                </span>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total e Salvar */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-semibold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(getCartTotal())}
                      </span>
                    </div>

                    <button
                      onClick={saveSale}
                      disabled={!canSave}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Salvar Venda ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                        </>
                      )}
                    </button>
                    
                    {/* Status de Validação */}
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Status de Validação:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${cart.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cart.length > 0 ? '✅' : '❌'} Itens: {cart.length}
                        </div>
                        <div className={`flex items-center gap-1 ${customerName.trim() ? 'text-green-600' : 'text-red-600'}`}>
                          {customerName.trim() ? '✅' : '❌'} Cliente: {customerName.trim() || 'Vazio'}
                        </div>
                        <div className={`flex items-center gap-1 ${isCashRegisterOpen ? 'text-green-600' : 'text-red-600'}`}>
                          {isCashRegisterOpen ? '✅' : '❌'} Caixa: Loja {storeId}
                        </div>
                        <div className={`flex items-center gap-1 ${canSave ? 'text-green-600' : 'text-red-600'}`}>
                          {canSave ? '✅' : '❌'} Status: {canSave ? 'PRONTO' : 'FALTAM DADOS'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Mesa */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" />
                Nova Mesa
              </h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: 5"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Mesa 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (pessoas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTable(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addTable}
                disabled={!newTableNumber || !newTableName}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Peso */}
      {showWeightModal && selectedProductForWeight && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Scale size={20} className="text-green-600" />
                Pesagem - {selectedProductForWeight.name}
              </h3>
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setSelectedProductForWeight(null);
                  setProductWeight('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.500"
                  autoFocus
                />
              </div>

              {productWeight && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>Valor calculado:</strong> {formatPrice((selectedProductForWeight.price_per_gram || 0) * parseFloat(productWeight) * 1000)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setSelectedProductForWeight(null);
                  setProductWeight('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmWeight}
                disabled={!productWeight || parseFloat(productWeight) <= 0}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;