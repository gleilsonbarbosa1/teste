import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Save, 
  X, 
  ShoppingCart,
  Scale,
  AlertCircle,
  Package,
  Minus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { RestaurantTable, TableSale, TableCartItem } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentType, setPaymentType] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeAmount, setChangeAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNewTable, setShowNewTable] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<PDVProduct | null>(null);
  const [productWeight, setProductWeight] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [loading, setLoading] = useState(true);

  // Hooks para produtos e caixa baseados na loja
  const { products } = usePDVProducts();
  const loja1CashRegister = usePDVCashRegister();
  const loja2CashRegister = useStore2PDVCashRegister();
  
  // Selecionar o hook correto baseado na loja
  const cashRegisterHook = storeId === 1 ? loja1CashRegister : loja2CashRegister;
  const { isOpen: isCashRegisterOpen, currentRegister } = cashRegisterHook;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Carregar mesas
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar produto ao carrinho
  const addToCart = (product: PDVProduct, weight?: number) => {
    if (product.is_weighable && !weight) {
      setSelectedProductForWeight(product);
      setShowWeightModal(true);
      return;
    }

    const unitPrice = product.is_weighable 
      ? ((product.price_per_gram || 0) * (weight || 0) * 1000)
      : (product.unit_price || 0);

    const newItem: TableCartItem = {
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

  // Atualizar quantidade
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const unitPrice = item.unit_price || 0;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  // Calcular total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Criar nova mesa
  const createTable = async () => {
    if (!newTableNumber || !newTableName) return;

    try {
      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tableName)
        .insert([{
          number: parseInt(newTableNumber),
          name: newTableName,
          capacity: newTableCapacity,
          status: 'livre',
          is_active: true
        }]);

      if (error) throw error;

      await fetchTables();
      setShowNewTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert('Erro ao criar mesa');
    }
  };

  // Excluir mesa
  const deleteTable = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    try {
      const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;
      await fetchTables();
    } catch (err) {
      console.error('Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa');
    }
  };

  // Abrir modal de venda
  const openSaleModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setShowSaleModal(true);
    setCart([]);
    setCustomerName('');
    setCustomerCount(1);
    setPaymentType('dinheiro');
    setChangeAmount(0);
    setNotes('');
  };

  // Salvar venda
  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim()) return;

    try {
      if (!isCashRegisterOpen) {
        alert('Não é possível realizar vendas sem um caixa aberto');
        return;
      }

      const saleData = {
        table_id: selectedTable.id,
        operator_name: operatorName || 'Operador',
        customer_name: customerName.trim(),
        customer_count: customerCount,
        subtotal: getCartTotal(),
        discount_amount: 0,
        total_amount: getCartTotal(),
        payment_type: paymentType,
        change_amount: changeAmount,
        status: 'aberta' as const,
        notes: notes || undefined
      };

      const saleTableName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      const { data: sale, error: saleError } = await supabase
        .from(saleTableName)
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal,
        notes: item.notes
      }));

      const saleItemsTableName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      
      const { error: itemsError } = await supabase
        .from(saleItemsTableName)
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar status da mesa
      const tableUpdateName = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      await supabase
        .from(tableUpdateName)
        .update({ 
          status: 'ocupada',
          current_sale_id: sale.id
        })
        .eq('id', selectedTable.id);

      // Adicionar ao caixa se estiver aberto
      if (currentRegister) {
        const cashEntriesTable = storeId === 1 ? 'pdv_cash_entries' : 'pdv2_cash_entries';
        
        await supabase
          .from(cashEntriesTable)
          .insert([{
            register_id: currentRegister.id,
            type: 'income',
            amount: getCartTotal(),
            description: `Venda Mesa ${selectedTable.number} - ${customerName}`,
            payment_method: paymentType
          }]);
      }

      await fetchTables();
      setShowSaleModal(false);
      alert('Venda salva com sucesso!');

    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      alert('Erro ao salvar venda');
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando mesas da Loja {storeId}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Vendas de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie mesas e vendas presenciais</p>
        </div>
        <button
          onClick={() => setShowNewTable(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Mesa
        </button>
      </div>

      {/* Status do Caixa */}
      {!isCashRegisterOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Caixa Fechado - Loja {storeId}</h3>
              <p className="text-red-700 text-sm">
                Não é possível realizar vendas sem um caixa aberto. Abra o caixa primeiro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`p-4 rounded-lg border-2 transition-all ${getTableStatusColor(table.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Mesa {table.number}</h3>
              <button
                onClick={() => deleteTable(table.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <p className="text-sm mb-1">{table.name}</p>
            <p className="text-xs mb-3">Capacidade: {table.capacity} pessoas</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium capitalize">
                {table.status.replace('_', ' ')}
              </span>
              
              {table.status === 'livre' && (
                <button
                  onClick={() => openSaleModal(table)}
                  disabled={!isCashRegisterOpen}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  Nova Venda
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma mesa cadastrada para a Loja {storeId}</p>
        </div>
      )}

      {/* Modal Nova Mesa */}
      {showNewTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - Loja {storeId}</h3>
              <button
                onClick={() => setShowNewTable(false)}
                className="text-gray-400 hover:text-gray-600"
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
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: 1"
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Mesa da Janela"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade (pessoas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTable(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createTable}
                  disabled={!newTableNumber || !newTableName}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white py-2 rounded-lg transition-colors"
                >
                  Criar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venda */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Nova Venda - Mesa {selectedTable.number} - Loja {storeId}
                </h3>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex h-[70vh]">
              {/* Produtos - 30% */}
              <div className="w-[30%] border-r border-gray-200 p-4">
                <div className="space-y-4">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 overflow-y-auto h-[50vh]">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.code}</div>
                            <div className="text-sm font-semibold text-green-600">
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
                            className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carrinho e Detalhes - 70% */}
              <div className="w-[70%] p-4 flex flex-col">
                {/* Dados do Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Carrinho */}
                <div className="flex-1 overflow-y-auto">
                  <h4 className="font-medium mb-3">Itens do Pedido ({cart.length})</h4>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Nenhum item no carrinho</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{item.product_name}</div>
                              <div className="text-sm text-gray-500">{item.product_code}</div>
                              {item.weight && (
                                <div className="text-sm text-orange-600 flex items-center gap-1">
                                  <Scale size={12} />
                                  {item.weight}kg
                                </div>
                              )}
                              <div className="text-lg font-semibold text-green-600 mt-1">
                                {formatPrice(item.subtotal)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!item.weight && (
                                <>
                                  <button
                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                    className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => removeFromCart(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
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

                {/* Total e Botão */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>

                  <button
                    onClick={saveSale}
                    disabled={cart.length === 0 || !customerName.trim() || !isCashRegisterOpen}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Salvar Venda ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                  </button>
                  
                  <div className="text-xs text-center mt-2 space-y-1">
                    {!isCashRegisterOpen ? (
                      <p className="text-red-600">❌ Caixa fechado - não é possível salvar vendas</p>
                    ) : (
                      <p className="text-green-600">✅ Caixa aberto - Loja {storeId}</p>
                    )}
                    <p className="text-gray-500">
                      Itens: {cart.length} | Cliente: {customerName.trim() ? '✅' : '❌'} | Total: {formatPrice(getCartTotal())}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Peso */}
      {showWeightModal && selectedProductForWeight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Informar Peso</h3>
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setSelectedProductForWeight(null);
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
                  {selectedProductForWeight.name}
                </div>
                <div className="text-sm text-orange-600">
                  {formatPrice((selectedProductForWeight.price_per_gram || 0) * 1000)}/kg
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
                      {formatPrice((selectedProductForWeight.price_per_gram || 0) * parseFloat(productWeight) * 1000)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setSelectedProductForWeight(null);
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