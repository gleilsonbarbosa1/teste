import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, RefreshCw, AlertCircle, Clock, CheckCircle, 
  Utensils, Sparkles, ShoppingCart, X, Minus, Calculator, DollarSign,
  Save, Package, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RestaurantTable, TableSale, TableCartItem } from '../../types/table-sales';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    capacity: 4,
    location: ''
  });

  const { products: pdvProducts, loading: productsLoading } = usePDVProducts();
  const loja1CashRegister = usePDVCashRegister();
  const loja2CashRegister = useStore2PDVCashRegister();
  
  const cashRegisterHook = storeId === 1 ? loja1CashRegister : loja2CashRegister;
  const { isOpen: isCashRegisterOpen, currentRegister, addCashEntry } = cashRegisterHook;

  const getStoreName = () => storeId === 1 ? 'Loja 1' : 'Loja 2';
  const getTableName = () => storeId === 1 ? 'store1_tables' : 'store2_tables';
  const getSalesTableName = () => storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const getSaleItemsTableName = () => storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  const filteredProducts = searchTerm ? 
    pdvProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) : pdvProducts;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        console.warn(`⚠️ Supabase não configurado - usando dados de demonstração para ${getStoreName()}`);
        
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: `Mesa 1 - ${getStoreName()}`,
            capacity: 4,
            status: 'livre',
            location: 'Área Central',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: `Mesa 2 - ${getStoreName()}`,
            capacity: 6,
            status: 'ocupada',
            location: 'Área VIP',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        setLoading(false);
        return;
      }

      const tableName = getTableName();
      const salesTableName = getSalesTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .select(`*, current_sale:${salesTableName}!${tableName}_current_sale_id_fkey(*)`)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      
      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas para ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da ${getStoreName()}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
      
      const demoTables: RestaurantTable[] = [
        {
          id: 'demo-1',
          number: 1,
          name: `Mesa 1 - ${getStoreName()}`,
          capacity: 4,
          status: 'livre',
          location: 'Demonstração',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTables(demoTables);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTable.number || !newTable.name) {
      alert('Número e nome da mesa são obrigatórios');
      return;
    }

    const existingTable = tables.find(t => t.number === parseInt(newTable.number));
    if (existingTable) {
      alert(`Mesa número ${newTable.number} já existe. Escolha um número diferente.`);
      return;
    }

    try {
      const tableName = getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([{
          number: parseInt(newTable.number),
          name: newTable.name,
          capacity: newTable.capacity,
          status: 'livre',
          location: newTable.location,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert(`Mesa número ${newTable.number} já existe. Escolha um número diferente.`);
          return;
        }
        throw error;
      }

      setTables(prev => [...prev, data]);
      setShowCreateModal(false);
      setNewTable({ number: '', name: '', capacity: 4, location: '' });
      
      console.log(`✅ Mesa criada na ${getStoreName()}:`, data);
    } catch (err) {
      console.error(`❌ Erro ao criar mesa na ${getStoreName()}:`, err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: RestaurantTable['status']) => {
    try {
      const tableName = getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;

      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, status: newStatus } : table
      ));
      
      console.log(`✅ Status da mesa atualizado na ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao atualizar status da mesa na ${getStoreName()}:`, err);
      alert('Erro ao atualizar status da mesa');
    }
  };

  const deleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a ${tableName}?`)) return;

    try {
      const tableNameDb = getTableName();
      
      const { error } = await supabase
        .from(tableNameDb)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(table => table.id !== tableId));
      console.log(`✅ Mesa excluída da ${getStoreName()}`);
    } catch (err) {
      console.error(`❌ Erro ao excluir mesa da ${getStoreName()}:`, err);
      alert('Erro ao excluir mesa');
    }
  };

  const openSaleModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setCurrentSale(table.current_sale || null);
    
    if (table.current_sale) {
      setCustomerName(table.current_sale.customer_name || '');
      setCustomerCount(table.current_sale.customer_count || 1);
      setNotes(table.current_sale.notes || '');
      // Carregar itens da venda se houver
    } else {
      setCustomerName('');
      setCustomerCount(1);
      setNotes('');
      setCart([]);
    }
    
    setShowSaleModal(true);
  };

  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex(item => item.product_code === product.code);
    
    if (existingIndex >= 0) {
      setCart(prev => prev.map((item, index) => {
        if (index === existingIndex) {
          const newQuantity = item.quantity + 1;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: calculateItemSubtotal(item, newQuantity)
          };
        }
        return item;
      }));
    } else {
      const newItem: TableCartItem = {
        product_code: product.code,
        product_name: product.name,
        quantity: 1,
        unit_price: product.is_weighable ? undefined : product.unit_price,
        price_per_gram: product.is_weighable ? product.price_per_gram : undefined,
        subtotal: product.is_weighable ? 0 : product.unit_price || 0
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          quantity,
          subtotal: calculateItemSubtotal(item, quantity)
        };
      }
      return item;
    }));
  };

  const calculateItemSubtotal = (item: TableCartItem, quantity: number) => {
    if (item.price_per_gram && item.weight) {
      return item.weight * 1000 * item.price_per_gram * quantity;
    } else if (item.unit_price) {
      return item.unit_price * quantity;
    }
    return 0;
  };

  const createOrUpdateSale = async () => {
    if (!selectedTable || !isCashRegisterOpen) {
      alert('Nenhum caixa aberto ou mesa selecionada');
      return;
    }

    if (cart.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return;
    }

    try {
      const salesTableName = getSalesTableName();
      const saleItemsTableName = getSaleItemsTableName();
      const tableName = getTableName();
      const subtotal = calculateCartTotal();
      const total = subtotal;

      let sale;

      if (currentSale) {
        // Atualizar venda existente
        const { data: updatedSale, error: saleError } = await supabase
          .from(salesTableName)
          .update({
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: subtotal,
            total_amount: total,
            notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSale.id)
          .select()
          .single();

        if (saleError) throw saleError;
        sale = updatedSale;

        // Deletar itens existentes
        await supabase
          .from(saleItemsTableName)
          .delete()
          .eq('sale_id', currentSale.id);
      } else {
        // Criar nova venda
        const { data: newSale, error: saleError } = await supabase
          .from(salesTableName)
          .insert([{
            table_id: selectedTable.id,
            operator_name: operatorName,
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: subtotal,
            total_amount: total,
            status: 'aberta',
            notes: notes
          }])
          .select()
          .single();

        if (saleError) throw saleError;
        sale = newSale;

        // Atualizar mesa com venda atual
        await supabase
          .from(tableName)
          .update({ 
            current_sale_id: sale.id,
            status: 'ocupada'
          })
          .eq('id', selectedTable.id);
      }

      // Inserir itens da venda
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

      const { error: itemsError } = await supabase
        .from(saleItemsTableName)
        .insert(saleItems);

      if (itemsError) throw itemsError;

      console.log(`✅ Venda ${currentSale ? 'atualizada' : 'criada'} na ${getStoreName()}`);
      
      // Recarregar mesas
      await fetchTables();
      setShowSaleModal(false);
      setCart([]);
      setCurrentSale(null);
      
    } catch (err) {
      console.error(`❌ Erro ao salvar venda na ${getStoreName()}:`, err);
      alert(`Erro ao salvar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const finalizeSale = async () => {
    if (!currentSale || !selectedTable || !isCashRegisterOpen) return;

    try {
      const salesTableName = getSalesTableName();
      const tableName = getTableName();
      
      // Finalizar venda
      const { error: saleError } = await supabase
        .from(salesTableName)
        .update({
          status: 'fechada',
          payment_type: paymentMethod,
          change_amount: changeFor || 0,
          closed_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      if (saleError) throw saleError;

      // Liberar mesa
      await supabase
        .from(tableName)
        .update({ 
          current_sale_id: null,
          status: 'limpeza'
        })
        .eq('id', selectedTable.id);

      // Adicionar ao caixa
      if (addCashEntry) {
        await addCashEntry({
          type: 'income',
          amount: currentSale.total_amount,
          description: `Venda Mesa #${selectedTable.number} - ${getStoreName()} (${getPaymentMethodName(paymentMethod)})`,
          payment_method: paymentMethod
        });
      }

      console.log(`✅ Venda finalizada na ${getStoreName()}`);
      
      // Recarregar mesas
      await fetchTables();
      setShowSaleModal(false);
      setCurrentSale(null);
      
    } catch (err) {
      console.error(`❌ Erro ao finalizar venda na ${getStoreName()}:`, err);
      alert(`Erro ao finalizar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const getPaymentMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return methodNames[method] || method;
  };

  const getStatusConfig = (status: RestaurantTable['status']) => {
    switch (status) {
      case 'livre':
        return {
          label: 'Livre',
          color: 'bg-green-100 border-green-300 text-green-800',
          icon: CheckCircle,
          buttonColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'ocupada':
        return {
          label: 'Ocupada',
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: Users,
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'aguardando_conta':
        return {
          label: 'Aguardando Conta',
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          icon: Clock,
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case 'limpeza':
        return {
          label: 'Limpeza',
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          icon: Sparkles,
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gray-100 border-gray-300 text-gray-800',
          icon: AlertCircle,
          buttonColor: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  const getStatusOptions = (currentStatus: RestaurantTable['status']) => {
    const allStatuses: RestaurantTable['status'][] = ['livre', 'ocupada', 'aguardando_conta', 'limpeza'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mesas da {getStoreName()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Caixa Status Warning */}
      {!isCashRegisterOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-yellow-800 font-medium">
              Caixa da {getStoreName()} está fechado - não é possível processar vendas
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Utensils size={24} className="text-indigo-600" />
            Vendas de Mesas - {getStoreName()}
          </h2>
          <p className="text-gray-600">Gerencie mesas e atendimento presencial</p>
          {operatorName && (
            <p className="text-sm text-indigo-600">Operador: {operatorName}</p>
          )}
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
          <p className="text-red-500 text-sm mt-1">
            Exibindo dados de demonstração devido ao erro
          </p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => {
          const statusConfig = getStatusConfig(table.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div
              key={table.id}
              className={`border-2 rounded-lg p-6 transition-all hover:shadow-md ${statusConfig.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <StatusIcon size={20} />
                  <h3 className="text-lg font-semibold">Mesa {table.number}</h3>
                </div>
                <button
                  onClick={() => deleteTable(table.id, table.name)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir mesa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="font-medium">{table.name}</p>
                <p className="text-sm opacity-75">
                  Capacidade: {table.capacity} pessoas
                </p>
                {table.location && (
                  <p className="text-sm opacity-75">
                    Local: {table.location}
                  </p>
                )}
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                  <StatusIcon size={12} className="mr-1" />
                  {statusConfig.label}
                </div>
              </div>
              
              {/* Sale Actions */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => openSaleModal(table)}
                  disabled={!isCashRegisterOpen}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <ShoppingCart size={16} />
                  {table.current_sale ? 'Gerenciar Venda' : 'Nova Venda'}
                </button>
              </div>
              
              {/* Status Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium opacity-75">Mudar Status:</p>
                <div className="flex flex-wrap gap-1">
                  {getStatusOptions(table.status).map((status) => {
                    const config = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => updateTableStatus(table.id, status)}
                        className={`text-xs px-2 py-1 rounded text-white transition-colors ${config.buttonColor}`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {table.current_sale && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium">Venda Ativa:</p>
                  <p className="text-sm">#{table.current_sale.sale_number}</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatPrice(table.current_sale.total_amount)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhuma mesa encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            Comece criando sua primeira mesa para a {getStoreName()}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Criar Primeira Mesa
          </button>
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - {getStoreName()}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
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
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mesa VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Área Central"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                disabled={!newTable.number || !newTable.name}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Venda - Mesa {selectedTable.number} ({getStoreName()})
                  </h3>
                  <p className="text-gray-600">{selectedTable.name}</p>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Products Section */}
              <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
                <h4 className="text-lg font-medium mb-4">Produtos</h4>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Products List */}
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{product.name}</h5>
                          <p className="text-sm text-gray-600">{product.code}</p>
                          <p className="text-sm font-semibold text-green-600">
                            {product.is_weighable 
                              ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                              : formatPrice(product.unit_price || 0)
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              <div className="w-1/2 p-6 flex flex-col">
                <h4 className="text-lg font-medium mb-4">Carrinho</h4>
                
                {/* Customer Info */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto mb-4">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
                      <p>Carrinho vazio</p>
                      <p className="text-sm">Adicione produtos para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{item.product_name}</h5>
                            <button
                              onClick={() => setCart(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="font-semibold text-green-600">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {currentSale && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">PIX</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="voucher">Voucher</option>
                      <option value="misto">Misto</option>
                    </select>

                    {paymentMethod === 'dinheiro' && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Troco para
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={changeFor || ''}
                          onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(calculateCartTotal())}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowSaleModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  
                  {!currentSale ? (
                    <button
                      onClick={createOrUpdateSale}
                      disabled={cart.length === 0 || !isCashRegisterOpen}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Criar Venda
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={createOrUpdateSale}
                        disabled={cart.length === 0}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Salvar
                      </button>
                      <button
                        onClick={finalizeSale}
                        disabled={!paymentMethod}
                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Finalizar
                      </button>
                    </>
                  )}
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