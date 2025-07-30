import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Package, Scale, X, ShoppingCart, User, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  notes?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Modal states
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Produtos de demonstração
  const demoProducts = [
    { code: 'ACAI300', name: 'Açaí 300ml', price: 15.90, is_weighable: false },
    { code: 'ACAI500', name: 'Açaí 500ml', price: 22.90, is_weighable: false },
    { code: 'ACAI1KG', name: 'Açaí 1kg', price_per_gram: 0.04499, is_weighable: true },
    { code: 'COMBO1', name: 'Combo Casal', price: 49.99, is_weighable: false }
  ];

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
    
    if (isConfigured) {
      loadTables();
    } else {
      // Mesas de demonstração
      setTables([
        { id: 1, number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: 2, number: 2, name: 'Mesa 2', capacity: 6, status: 'livre', is_active: true },
        { id: 3, number: 3, name: 'Mesa 3', capacity: 2, status: 'livre', is_active: true },
        { id: 4, number: 4, name: 'Mesa 4', capacity: 8, status: 'livre', is_active: true }
      ]);
      setLoading(false);
    }
  }, [storeId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { data, error } = await supabase
        .from(tablesTable)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
      
      // Fallback para demonstração
      setTables([
        { id: 1, number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: 2, number: 2, name: 'Mesa 2', capacity: 6, status: 'livre', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Preencha número e nome da mesa');
      return;
    }

    const tableNumber = parseInt(newTableNumber);
    
    // Verificar se já existe
    if (tables.some(t => t.number === tableNumber)) {
      alert('Já existe uma mesa com este número');
      return;
    }

    if (supabaseConfigured) {
      try {
        const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
        
        const { data, error } = await supabase
          .from(tablesTable)
          .insert([{
            number: tableNumber,
            name: newTableName,
            capacity: newTableCapacity,
            status: 'livre',
            is_active: true
          }])
          .select()
          .single();

        if (error) throw error;
        
        setTables(prev => [...prev, data]);
      } catch (err) {
        console.error('Erro ao criar mesa:', err);
        alert('Erro ao criar mesa');
        return;
      }
    } else {
      // Modo demonstração
      const newTable = {
        id: Date.now(),
        number: tableNumber,
        name: newTableName,
        capacity: newTableCapacity,
        status: 'livre',
        is_active: true
      };
      setTables(prev => [...prev, newTable]);
    }

    setShowAddTable(false);
    setNewTableNumber('');
    setNewTableName('');
    setNewTableCapacity(4);
  };

  const deleteTable = async (tableId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
      setCart([]);
      setCustomerName('');
    }

    if (supabaseConfigured) {
      try {
        const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
        
        const { error } = await supabase
          .from(tablesTable)
          .update({ is_active: false })
          .eq('id', tableId);

        if (error) throw error;
      } catch (err) {
        console.error('Erro ao excluir mesa:', err);
        alert('Erro ao excluir mesa');
        return;
      }
    }

    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  const changeTableStatus = async (tableId: number, newStatus: string) => {
    if (supabaseConfigured) {
      try {
        const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
        
        const { error } = await supabase
          .from(tablesTable)
          .update({ status: newStatus })
          .eq('id', tableId);

        if (error) throw error;
      } catch (err) {
        console.error('Erro ao alterar status:', err);
      }
    }

    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, status: newStatus } : t
    ));
  };

  const addToCart = (product: any) => {
    if (product.is_weighable) {
      // Para produtos pesáveis, usar peso padrão de 500g
      const weight = 0.5; // 500g
      const price = product.price_per_gram * weight * 1000;
      
      const item: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        weight: weight,
        price_per_gram: product.price_per_gram,
        subtotal: price
      };
      
      setCart(prev => [...prev, item]);
    } else {
      const item: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price
      };
      
      setCart(prev => [...prev, item]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-200';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguard. Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim()) {
      alert('Preencha todos os dados obrigatórios');
      return;
    }

    const total = getCartTotal();
    
    try {
      console.log(`💾 Salvando venda da mesa ${selectedTable.name} - Loja ${storeId}`);
      
      if (supabaseConfigured) {
        const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
        const itemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
        
        // Criar venda
        const { data: sale, error: saleError } = await supabase
          .from(salesTable)
          .insert([{
            table_id: selectedTable.id,
            operator_name: operatorName || 'Operador',
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: total,
            total_amount: total,
            status: 'fechada'
          }])
          .select()
          .single();

        if (saleError) throw saleError;

        // Criar itens
        const items = cart.map(item => ({
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

        const { error: itemsError } = await supabase
          .from(itemsTable)
          .insert(items);

        if (itemsError) throw itemsError;

        // Adicionar ao caixa se disponível
        try {
          const cashTable = storeId === 1 ? 'pdv_cash_entries' : 'pdv2_cash_entries';
          const registersTable = storeId === 1 ? 'pdv_cash_registers' : 'pdv2_cash_registers';
          
          // Buscar caixa aberto
          const { data: openRegister } = await supabase
            .from(registersTable)
            .select('id')
            .is('closed_at', null)
            .limit(1)
            .single();

          if (openRegister) {
            await supabase
              .from(cashTable)
              .insert([{
                register_id: openRegister.id,
                type: 'income',
                amount: total,
                description: `Venda Mesa ${selectedTable.number} - ${customerName}`,
                payment_method: 'dinheiro'
              }]);
          }
        } catch (cashError) {
          console.warn('Erro ao adicionar ao caixa (não crítico):', cashError);
        }
      }
      
      // Limpar carrinho
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      
      // Atualizar status da mesa
      await changeTableStatus(selectedTable.id, 'livre');
      
      alert(`✅ Venda da ${selectedTable.name} salva com sucesso!\nTotal: ${formatPrice(total)}`);
      
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      alert('Erro ao salvar venda');
    }
  };

  const canSave = selectedTable && cart.length > 0 && customerName.trim() && !loading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🍽️ Vendas por Mesa - Loja {storeId}
          </h1>
          <p className="text-gray-600">
            Gerencie vendas presenciais por mesa
          </p>
          
          {!supabaseConfigured && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ Modo demonstração - Configure Supabase para salvar no banco
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar - Mesas */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  Mesas ({tables.length})
                </h2>
                <button
                  onClick={() => setShowAddTable(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-all transform hover:scale-105"
                  title="Adicionar Mesa"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTable?.id === table.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setSelectedTable(table)}
                        className="flex-1 text-left"
                      >
                        <div className="font-semibold text-gray-800 text-lg">
                          🍽️ {table.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          👥 {table.capacity} pessoas
                        </div>
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
                        onChange={(e) => changeTableStatus(table.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Mesa Selecionada */}
            {selectedTable && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📋 Venda - {selectedTable.name}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Digite o nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Pessoas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customerCount}
                      onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Produtos */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Produtos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {demoProducts.map((product) => (
                      <button
                        key={product.code}
                        onClick={() => addToCart(product)}
                        className="p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {product.is_weighable ? (
                            <Scale size={16} className="text-orange-600" />
                          ) : (
                            <Package size={16} className="text-blue-600" />
                          )}
                          <span className="font-medium text-sm">{product.name}</span>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">
                          {product.is_weighable 
                            ? `${formatPrice(product.price_per_gram * 1000)}/kg`
                            : formatPrice(product.price)
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carrinho */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Carrinho ({cart.length} itens)
                  </h3>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item.product_name}</div>
                            <div className="text-sm text-gray-600">
                              {item.weight 
                                ? `${(item.weight * 1000).toFixed(0)}g - ${formatPrice(item.price_per_gram * 1000)}/kg`
                                : `${item.quantity}x - ${formatPrice(item.unit_price)}`
                              }
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-green-600">
                              {formatPrice(item.subtotal)}
                            </span>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão Salvar */}
                <div className="mt-6">
                  <button
                    onClick={saveSale}
                    disabled={!canSave}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      canSave
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canSave ? '💾 Salvar Venda' : '❌ Preencha todos os dados'}
                  </button>
                </div>
              </div>
            )}

            {!selectedTable && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Selecione uma Mesa
                </h3>
                <p className="text-gray-500">
                  Escolha uma mesa para iniciar uma venda
                </p>
              </div>
            )}
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
                Nova Mesa - Loja {storeId}
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
                onClick={createTable}
                disabled={!newTableNumber || !newTableName}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;