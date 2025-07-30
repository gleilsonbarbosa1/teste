import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { RestaurantTable, TableSale, TableCartItem } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  Minus, 
  User,
  Phone,
  CreditCard,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Save,
  X,
  Package
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName = 'Operador' }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentType, setPaymentType] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [newTableNumber, setNewTableNumber] = useState(1);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Hooks específicos por loja
  const { products } = usePDVProducts();
  const cashRegisterHook1 = usePDVCashRegister();
  const cashRegisterHook2 = useStore2PDVCashRegister();
  
  // Escolher o hook correto baseado na loja
  const cashRegister = storeId === 1 ? cashRegisterHook1 : cashRegisterHook2;
  const { isOpen: isCashRegisterOpen } = cashRegister;

  const tableName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const tableSalesName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const tableSaleItemsName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área Principal',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2', 
            number: 2,
            name: 'Mesa 2',
            capacity: 2,
            status: 'ocupada',
            location: 'Área Principal',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          current_sale:${tableSalesName}!${tableName}_current_sale_id_fkey(*)
        `)
        .eq('is_active', true)
        .order('number', { ascending: true });

      if (error) throw error;

      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas da Loja ${storeId} carregadas`);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
      
      // Dados de demonstração em caso de erro
      const demoTables: RestaurantTable[] = [
        {
          id: '1',
          number: 1,
          name: 'Mesa 1',
          capacity: 4,
          status: 'livre',
          location: 'Área Principal',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTables(demoTables);
    } finally {
      setLoading(false);
    }
  }, [storeId, tableName, tableSalesName]);

  const createTable = useCallback(async () => {
    try {
      // Verificar se já existe uma mesa com esse número
      const existingTable = tables.find(t => t.number === newTableNumber);
      if (existingTable) {
        alert(`Já existe uma mesa com o número ${newTableNumber}. Escolha um número diferente.`);
        return;
      }

      console.log(`🚀 Criando mesa ${newTableNumber} na Loja ${storeId}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          number: newTableNumber,
          name: newTableName || `Mesa ${newTableNumber}`,
          capacity: newTableCapacity,
          status: 'livre',
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        // Verificar se é erro de chave duplicada
        if (error.code === '23505' && error.message.includes('store1_tables_number_key')) {
          throw new Error(`Mesa número ${newTableNumber} já existe. Escolha um número diferente.`);
        }
        throw error;
      }

      setTables(prev => [...prev, data]);
      setShowCreateTable(false);
      setNewTableNumber(Math.max(...tables.map(t => t.number), 0) + 1);
      setNewTableName('');
      setNewTableCapacity(4);
      console.log(`✅ Mesa ${newTableNumber} criada na Loja ${storeId}`);
    } catch (err) {
      console.error('❌ Erro ao criar mesa:', err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [storeId, newTableNumber, newTableName, newTableCapacity, tables, tableName]);

  const updateTableStatus = useCallback(async (tableId: string, status: RestaurantTable['status']) => {
    try {
      console.log(`🔄 Atualizando status da mesa ${tableId} para ${status}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;

      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, status } : table
      ));
      
      console.log(`✅ Status da mesa atualizado para ${status}`);
    } catch (err) {
      console.error('❌ Erro ao atualizar status da mesa:', err);
      alert('Erro ao atualizar status da mesa');
    }
  }, [tableName]);

  const deleteTable = useCallback(async (tableId: string, tableName: string) => {
    if (confirm(`Tem certeza que deseja excluir a ${tableName}?`)) {
      try {
        console.log(`🗑️ Excluindo mesa ${tableId}`);
        
        const { error } = await supabase
          .from(tableName)
          .update({ is_active: false })
          .eq('id', tableId);

        if (error) throw error;

        setTables(prev => prev.filter(table => table.id !== tableId));
        console.log(`✅ Mesa excluída`);
      } catch (err) {
        console.error('❌ Erro ao excluir mesa:', err);
        alert('Erro ao excluir mesa');
      }
    }
  }, [tableName]);

  const openSale = useCallback((table: RestaurantTable) => {
    setSelectedTable(table);
    setShowSaleModal(true);
    setCart([]);
    setCustomerName('');
    setCustomerCount(1);
    setPaymentType('dinheiro');
    setChangeFor(undefined);
  }, []);

  const addToCart = useCallback((product: PDVProduct) => {
    const existingIndex = cart.findIndex(item => item.product_code === product.code);
    
    if (existingIndex >= 0) {
      setCart(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: (item.unit_price || 0) * newQuantity
          };
        }
        return item;
      }));
    } else {
      const newItem: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        unit_price: product.unit_price,
        price_per_gram: product.price_per_gram,
        subtotal: product.unit_price || 0
      };
      setCart(prev => [...prev, newItem]);
    }
  }, [cart]);

  const updateCartQuantity = useCallback((productCode: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product_code !== productCode));
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product_code === productCode) {
        return {
          ...item,
          quantity,
          subtotal: (item.unit_price || 0) * quantity
        };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((productCode: string) => {
    setCart(prev => prev.filter(item => item.product_code !== productCode));
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  }, [cart]);

  const createSale = useCallback(async () => {
    if (!selectedTable || cart.length === 0 || !customerName) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível criar vendas sem um caixa aberto');
      return;
    }

    try {
      console.log(`🚀 Criando venda para mesa ${selectedTable.number} - Loja ${storeId}`);
      
      const saleData = {
        table_id: selectedTable.id,
        operator_name: operatorName,
        customer_name: customerName,
        customer_count: customerCount,
        subtotal: getCartTotal(),
        discount_amount: 0,
        total_amount: getCartTotal(),
        status: 'aberta' as const
      };

      const { data: sale, error: saleError } = await supabase
        .from(tableSalesName)
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from(tableSaleItemsName)
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar mesa como ocupada
      await updateTableStatus(selectedTable.id, 'ocupada');
      
      // Atualizar current_sale_id na mesa
      await supabase
        .from(tableName)
        .update({ current_sale_id: sale.id })
        .eq('id', selectedTable.id);

      setShowSaleModal(false);
      console.log(`✅ Venda criada para mesa ${selectedTable.number}`);
    } catch (err) {
      console.error('❌ Erro ao criar venda:', err);
      alert(`Erro ao criar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [selectedTable, cart, customerName, customerCount, operatorName, getCartTotal, isCashRegisterOpen, storeId, tableSalesName, tableSaleItemsName, updateTableStatus, tableName]);

  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products.slice(0, 20);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    // Definir número inicial para nova mesa
    if (tables.length > 0) {
      const maxNumber = Math.max(...tables.map(t => t.number));
      setNewTableNumber(maxNumber + 1);
    }
  }, [tables]);

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
            <Users size={24} className="text-purple-600" />
            Vendas de Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">
            Gerencie mesas e vendas presenciais {operatorName ? `- ${operatorName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTables}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateTable(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Cash Register Warning */}
      {!isCashRegisterOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Caixa Fechado</h3>
              <p className="text-yellow-700 text-sm">
                Não é possível criar vendas sem um caixa aberto.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${getStatusColor(table.status)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{table.name}</h3>
                <p className="text-sm opacity-75">
                  {table.capacity} pessoa(s) • {table.location}
                </p>
              </div>
              <div className="text-2xl font-bold">
                {table.number}
              </div>
            </div>

            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {table.status === 'livre' && (
                <button
                  onClick={() => openSale(table)}
                  disabled={!isCashRegisterOpen}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Nova Venda
                </button>
              )}
              
              {table.status === 'ocupada' && (
                <>
                  <button
                    onClick={() => updateTableStatus(table.id, 'aguardando_conta')}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Conta
                  </button>
                  <button
                    onClick={() => updateTableStatus(table.id, 'livre')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Liberar
                  </button>
                </>
              )}
              
              {table.status === 'aguardando_conta' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'limpeza')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Finalizar
                </button>
              )}
              
              {table.status === 'limpeza' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'livre')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  Pronta
                </button>
              )}

              <button
                onClick={() => deleteTable(table.id, table.name)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Excluir mesa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            Crie a primeira mesa para começar a gerenciar vendas presenciais
          </p>
          <button
            onClick={() => setShowCreateTable(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Criar Primeira Mesa
          </button>
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - Loja {storeId}</h3>
              <button
                onClick={() => setShowCreateTable(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                  onChange={(e) => setNewTableNumber(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder={`Mesa ${newTableNumber}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createTable}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Criar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Nova Venda - {selectedTable.name} (Loja {storeId})
                </h3>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Products Section - 40% */}
              <div className="w-2/5 p-6 border-r border-gray-200 overflow-y-auto">
                <h4 className="font-medium text-gray-800 mb-4">Produtos Disponíveis</h4>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800">{product.name}</h5>
                        <p className="text-sm text-gray-500">Código: {product.code}</p>
                        <p className="text-sm font-semibold text-green-600">
                          {product.is_weighable 
                            ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                            : formatPrice(product.unit_price || 0)
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>

              {/* Cart Section - 60% */}
              <div className="w-3/5 flex flex-col">
                {/* Cart Items */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Carrinho ({cart.length} item{cart.length !== 1 ? 's' : ''})
                  </h4>

                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Nenhum item adicionado</p>
                      <p className="text-gray-400 text-sm">Busque e adicione produtos ao carrinho</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.product_code}
                          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-800 text-lg">{item.product_name}</h5>
                              <p className="text-sm text-gray-500 mb-2">Código: {item.product_code}</p>
                              {item.notes && (
                                <p className="text-sm text-gray-600 italic">Obs: {item.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product_code)}
                              className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateCartQuantity(item.product_code, item.quantity - 1)}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-medium text-lg w-12 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.product_code, item.quantity + 1)}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {formatPrice(item.unit_price || 0)} × {item.quantity}
                              </p>
                              <p className="font-bold text-lg text-green-600">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Info & Payment */}
                <div className="border-t border-gray-200 p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente *
                      </label>
                      <div className="relative">
                        <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nome do cliente"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Pessoas
                      </label>
                      <div className="relative">
                        <Users size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={customerCount}
                          onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
                        { value: 'pix', label: 'PIX', icon: Phone },
                        { value: 'cartao_credito', label: 'Cartão Crédito', icon: CreditCard },
                        { value: 'cartao_debito', label: 'Cartão Débito', icon: CreditCard },
                        { value: 'voucher', label: 'Voucher', icon: Package },
                        { value: 'misto', label: 'Misto', icon: DollarSign }
                      ].map(({ value, label, icon: Icon }) => (
                        <label
                          key={value}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            paymentType === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentType"
                            value={value}
                            checked={paymentType === value}
                            onChange={(e) => setPaymentType(e.target.value as any)}
                            className="sr-only"
                          />
                          <Icon size={16} />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {paymentType === 'dinheiro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Troco para quanto?
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={changeFor || ''}
                        onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                        placeholder="Valor para troco"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSaleModal(false)}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={createSale}
                      disabled={cart.length === 0 || !customerName || !isCashRegisterOpen}
                      className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Salvar Venda
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;