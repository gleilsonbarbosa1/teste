import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Clock,
  User,
  Package,
  Calculator,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Coffee
} from 'lucide-react';

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  location?: string;
  is_active: boolean;
  current_sale_id?: string;
  created_at: string;
  updated_at: string;
}

interface TableSale {
  id: string;
  table_id: string;
  sale_number: number;
  operator_name?: string;
  customer_name?: string;
  customer_count: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_type?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto';
  change_amount: number;
  status: 'aberta' | 'fechada' | 'cancelada';
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TableSaleItem {
  id: string;
  sale_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  weight_kg?: number;
  unit_price?: number;
  price_per_gram?: number;
  discount_amount: number;
  subtotal: number;
  notes?: string;
  created_at: string;
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

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [sales, setSales] = useState<TableSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showCreateSale, setShowCreateSale] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cartItems, setCartItems] = useState<TableCartItem[]>([]);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Form states
  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    capacity: 4,
    location: ''
  });

  const [saleForm, setSaleForm] = useState({
    customer_name: '',
    customer_count: 1,
    payment_type: 'dinheiro' as const,
    change_amount: 0,
    notes: ''
  });

  const [itemForm, setItemForm] = useState({
    product_code: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  });

  // Get table names
  const getTableTableName = () => storeId === 1 ? 'store1_tables' : 'store2_tables';
  const getSalesTableName = () => storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const getItemsTableName = () => storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setSupabaseConfigured(isConfigured);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800';
      case 'limpeza': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'livre': return 'Livre';
      case 'ocupada': return 'Ocupada';
      case 'aguardando_conta': return 'Aguardando Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  const fetchTables = useCallback(async () => {
    try {
      console.log(`🔄 Carregando mesas da Loja ${storeId}...`);
      
      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando dados de demonstração');
        
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            location: 'Área principal',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            number: 2,
            name: 'Mesa 2',
            capacity: 6,
            status: 'ocupada',
            location: 'Área principal',
            is_active: true,
            current_sale_id: 'demo-sale-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setTables(demoTables);
        return;
      }

      const { data, error } = await supabase
        .from(getTableTableName())
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;

      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar mesas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    }
  }, [storeId, supabaseConfigured]);

  const fetchSales = useCallback(async () => {
    try {
      if (!supabaseConfigured) {
        setSales([]);
        return;
      }

      console.log(`🔄 Carregando vendas de mesa da Loja ${storeId}...`);

      const { data, error } = await supabase
        .from(getSalesTableName())
        .select(`
          *,
          ${getItemsTableName()}(*)
        `)
        .eq('status', 'aberta')
        .order('opened_at', { ascending: false });

      if (error) throw error;

      setSales(data || []);
      console.log(`✅ ${data?.length || 0} vendas de mesa carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error(`❌ Erro ao carregar vendas da Loja ${storeId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
    }
  }, [storeId, supabaseConfigured]);

  const createTable = async () => {
    try {
      if (!tableForm.number || !tableForm.name) {
        alert('Número e nome da mesa são obrigatórios');
        return;
      }

      const tableNumber = parseInt(tableForm.number);
      if (isNaN(tableNumber) || tableNumber <= 0) {
        alert('Número da mesa deve ser um número válido maior que zero');
        return;
      }

      console.log(`🚀 Criando mesa ${tableNumber} na Loja ${storeId}...`);

      if (!supabaseConfigured) {
        alert('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
        return;
      }

      // NOVA LÓGICA: Verificar apenas mesas ATIVAS com o mesmo número
      const { data: existingTables, error: checkError } = await supabase
        .from(getTableTableName())
        .select('id, number, is_active')
        .eq('number', tableNumber)
        .eq('is_active', true);

      if (checkError) {
        console.error('❌ Erro ao verificar mesas existentes:', checkError);
        throw new Error(`Erro ao verificar mesas: ${checkError.message}`);
      }

      // Se existe mesa ATIVA com o mesmo número, bloquear
      if (existingTables && existingTables.length > 0) {
        alert(`❌ Mesa ${tableNumber} já existe e está ativa. Escolha outro número.`);
        return;
      }

      console.log(`✅ Número ${tableNumber} disponível para uso`);

      // Criar nova mesa
      const { data, error } = await supabase
        .from(getTableTableName())
        .insert([{
          number: tableNumber,
          name: tableForm.name,
          capacity: tableForm.capacity,
          location: tableForm.location || null,
          status: 'livre',
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar mesa:', error);
        
        // Tratamento específico para constraint de unicidade
        if (error.code === '23505') {
          alert('❌ Conflito de número de mesa. Tente recarregar a página e verificar novamente.');
          await fetchTables(); // Recarregar dados
          return;
        }
        
        throw new Error(`Erro ao criar mesa: ${error.message}`);
      }

      console.log('✅ Mesa criada com sucesso:', data);
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${tableNumber} criada com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      setTableForm({
        number: '',
        name: '',
        capacity: 4,
        location: ''
      });
      setShowCreateTable(false);
      await fetchTables();
    } catch (err) {
      console.error('❌ Erro na criação da mesa:', err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const deleteTable = async (table: RestaurantTable) => {
    if (table.status === 'ocupada') {
      alert('❌ Não é possível excluir mesa ocupada. Finalize a venda primeiro.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a ${table.name}?`)) {
      return;
    }

    try {
      console.log(`🗑️ Excluindo mesa ${table.number} da Loja ${storeId}...`);

      if (!supabaseConfigured) {
        alert('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
        return;
      }

      // Marcar como inativa ao invés de deletar
      const { error } = await supabase
        .from(getTableTableName())
        .update({ 
          is_active: false,
          status: 'livre',
          current_sale_id: null
        })
        .eq('id', table.id);

      if (error) {
        console.error('❌ Erro ao excluir mesa:', error);
        throw new Error(`Erro ao excluir mesa: ${error.message}`);
      }

      console.log('✅ Mesa excluída (marcada como inativa)');
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Mesa ${table.number} excluída com sucesso!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      await fetchTables();
    } catch (err) {
      console.error('❌ Erro na exclusão da mesa:', err);
      alert(`Erro ao excluir mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const openSale = async (table: RestaurantTable) => {
    try {
      console.log(`🚀 Abrindo venda para mesa ${table.number} na Loja ${storeId}...`);

      if (!supabaseConfigured) {
        alert('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
        return;
      }

      // Criar nova venda
      const { data: sale, error: saleError } = await supabase
        .from(getSalesTableName())
        .insert([{
          table_id: table.id,
          operator_name: operatorName || 'Operador',
          customer_name: saleForm.customer_name || 'Cliente',
          customer_count: saleForm.customer_count,
          subtotal: 0,
          discount_amount: 0,
          total_amount: 0,
          change_amount: 0,
          status: 'aberta',
          notes: saleForm.notes || null,
          opened_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (saleError) {
        console.error('❌ Erro ao criar venda:', saleError);
        throw new Error(`Erro ao criar venda: ${saleError.message}`);
      }

      // Atualizar status da mesa
      const { error: updateError } = await supabase
        .from(getTableTableName())
        .update({
          status: 'ocupada',
          current_sale_id: sale.id
        })
        .eq('id', table.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar status da mesa:', updateError);
        // Tentar reverter a criação da venda
        await supabase.from(getSalesTableName()).delete().eq('id', sale.id);
        throw new Error(`Erro ao atualizar mesa: ${updateError.message}`);
      }

      console.log('✅ Venda aberta com sucesso:', sale);
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Venda aberta para Mesa ${table.number}!
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      setCurrentSale(sale);
      setSelectedTable(table);
      setShowCreateSale(false);
      setSaleForm({
        customer_name: '',
        customer_count: 1,
        payment_type: 'dinheiro',
        change_amount: 0,
        notes: ''
      });
      
      await Promise.all([fetchTables(), fetchSales()]);
    } catch (err) {
      console.error('❌ Erro ao abrir venda:', err);
      alert(`Erro ao abrir venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const addItemToSale = async () => {
    if (!currentSale) {
      alert('Nenhuma venda ativa selecionada');
      return;
    }

    if (!itemForm.product_code || !itemForm.product_name) {
      alert('Código e nome do produto são obrigatórios');
      return;
    }

    if (itemForm.quantity <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    try {
      console.log(`➕ Adicionando item à venda ${currentSale.sale_number}...`);

      const subtotal = itemForm.unit_price * itemForm.quantity;

      if (!supabaseConfigured) {
        // Adicionar ao carrinho local
        const newItem: TableCartItem = {
          product_code: itemForm.product_code,
          product_name: itemForm.product_name,
          quantity: itemForm.quantity,
          unit_price: itemForm.unit_price,
          subtotal,
          notes: itemForm.notes
        };
        
        setCartItems(prev => [...prev, newItem]);
        setItemForm({
          product_code: '',
          product_name: '',
          quantity: 1,
          unit_price: 0,
          notes: ''
        });
        return;
      }

      // Adicionar item no banco
      const { error } = await supabase
        .from(getItemsTableName())
        .insert([{
          sale_id: currentSale.id,
          product_code: itemForm.product_code,
          product_name: itemForm.product_name,
          quantity: itemForm.quantity,
          unit_price: itemForm.unit_price,
          discount_amount: 0,
          subtotal,
          notes: itemForm.notes || null
        }]);

      if (error) {
        console.error('❌ Erro ao adicionar item:', error);
        throw new Error(`Erro ao adicionar item: ${error.message}`);
      }

      // Atualizar totais da venda
      const newSubtotal = currentSale.subtotal + subtotal;
      const newTotal = newSubtotal - currentSale.discount_amount;

      const { error: updateError } = await supabase
        .from(getSalesTableName())
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal
        })
        .eq('id', currentSale.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar totais:', updateError);
      }

      console.log('✅ Item adicionado com sucesso');
      
      setItemForm({
        product_code: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        notes: ''
      });
      
      await fetchSales();
    } catch (err) {
      console.error('❌ Erro ao adicionar item:', err);
      alert(`Erro ao adicionar item: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const closeSale = async (sale: TableSale, paymentType: string, changeAmount: number = 0) => {
    try {
      console.log(`🔒 Fechando venda ${sale.sale_number}...`);

      if (!supabaseConfigured) {
        alert('Supabase não configurado. Configure as variáveis de ambiente para usar esta funcionalidade.');
        return;
      }

      // Fechar venda
      const { error: saleError } = await supabase
        .from(getSalesTableName())
        .update({
          status: 'fechada',
          payment_type: paymentType,
          change_amount: changeAmount,
          closed_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (saleError) {
        console.error('❌ Erro ao fechar venda:', saleError);
        throw new Error(`Erro ao fechar venda: ${saleError.message}`);
      }

      // Liberar mesa
      const { error: tableError } = await supabase
        .from(getTableTableName())
        .update({
          status: 'livre',
          current_sale_id: null
        })
        .eq('id', sale.table_id);

      if (tableError) {
        console.error('❌ Erro ao liberar mesa:', tableError);
      }

      console.log('✅ Venda fechada com sucesso');
      
      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
      successMessage.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-semibold">Venda finalizada com sucesso!</p>
          <p class="text-sm opacity-90">Mesa liberada - Total: ${formatPrice(sale.total_amount)}</p>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 4000);
      
      setCurrentSale(null);
      setSelectedTable(null);
      setCartItems([]);
      
      await Promise.all([fetchTables(), fetchSales()]);
    } catch (err) {
      console.error('❌ Erro ao fechar venda:', err);
      alert(`Erro ao fechar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTables(), fetchSales()]);
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTables(), fetchSales()]);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchTables, fetchSales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando vendas de mesa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Coffee size={24} className="text-indigo-600" />
            Vendas de Mesa - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie mesas e vendas presenciais</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateTable(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Mesa
          </button>
        </div>
      </div>

      {/* Supabase Configuration Warning */}
      {!supabaseConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">Modo Demonstração</h3>
              <p className="text-yellow-700 text-sm">
                Supabase não configurado. Funcionalidades limitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
              selectedTable?.id === table.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Mesa {table.number}</h3>
                <p className="text-sm text-gray-600">{table.name}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>Capacidade: {table.capacity} pessoas</span>
              </div>
              {table.location && (
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  <span>{table.location}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {table.status === 'livre' && (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setShowCreateSale(true);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <DollarSign size={14} />
                  Abrir Venda
                </button>
              )}
              
              {table.status === 'ocupada' && (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    const sale = sales.find(s => s.table_id === table.id && s.status === 'aberta');
                    setCurrentSale(sale || null);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <Calculator size={14} />
                  Gerenciar
                </button>
              )}

              <button
                onClick={() => deleteTable(table)}
                disabled={table.status === 'ocupada'}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 px-3 rounded-lg transition-colors"
                title="Excluir mesa"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Coffee size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma mesa cadastrada
            </h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira mesa para começar as vendas presenciais
            </p>
            <button
              onClick={() => setShowCreateTable(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Criar Mesa
            </button>
          </div>
        )}
      </div>

      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Nova Mesa - Loja {storeId}</h2>
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="number"
                  min="1"
                  value={tableForm.number}
                  onChange={(e) => setTableForm(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Números de mesas excluídas podem ser reutilizados
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={tableForm.name}
                  onChange={(e) => setTableForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mesa 1"
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
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização (opcional)
                </label>
                <input
                  type="text"
                  value={tableForm.location}
                  onChange={(e) => setTableForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Área principal, Varanda..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateTable(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sale Modal */}
      {showCreateSale && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Abrir Venda - Mesa {selectedTable.number}
                </h2>
                <button
                  onClick={() => setShowCreateSale(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={saleForm.customer_name}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome do cliente (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedTable.capacity}
                  value={saleForm.customer_count}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, customer_count: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Capacidade da mesa: {selectedTable.capacity} pessoas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Observações sobre a venda (opcional)"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateSale(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => openSale(selectedTable)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <DollarSign size={16} />
                Abrir Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Management Modal */}
      {currentSale && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Venda #{currentSale.sale_number} - Mesa {selectedTable.number}
                </h2>
                <button
                  onClick={() => {
                    setCurrentSale(null);
                    setSelectedTable(null);
                    setCartItems([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="ml-2 font-medium">{currentSale.customer_name || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pessoas:</span>
                    <span className="ml-2 font-medium">{currentSale.customer_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Aberta em:</span>
                    <span className="ml-2 font-medium">{formatDateTime(currentSale.opened_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium text-green-600">{formatPrice(currentSale.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Add Item Form */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Adicionar Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={itemForm.product_code}
                    onChange={(e) => setItemForm(prev => ({ ...prev, product_code: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Código do produto"
                  />
                  <input
                    type="text"
                    value={itemForm.product_name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, product_name: e.target.value }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome do produto"
                  />
                  <input
                    type="number"
                    min="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Quantidade"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Preço unitário"
                  />
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    type="text"
                    value={itemForm.notes}
                    onChange={(e) => setItemForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Observações (opcional)"
                  />
                  <button
                    onClick={addItemToSale}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Items List */}
              {cartItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">Itens da Venda</h3>
                  <div className="space-y-2">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-gray-600 ml-2">({item.product_code})</span>
                          {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.quantity}x {formatPrice(item.unit_price || 0)}</div>
                          <div className="text-green-600 font-semibold">{formatPrice(item.subtotal)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">
                        {formatPrice(cartItems.reduce((sum, item) => sum + item.subtotal, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Form */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">Finalizar Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <select
                    value={saleForm.payment_type}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, payment_type: e.target.value as any }))}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                  </select>
                  {saleForm.payment_type === 'dinheiro' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleForm.change_amount}
                      onChange={(e) => setSaleForm(prev => ({ ...prev, change_amount: parseFloat(e.target.value) || 0 }))}
                      className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Valor do troco"
                    />
                  )}
                </div>
                <button
                  onClick={() => closeSale(currentSale, saleForm.payment_type, saleForm.change_amount)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <CheckCircle size={20} />
                  Finalizar Venda - {formatPrice(currentSale.total_amount)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Sales Summary */}
      {sales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Ativas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sales.map((sale) => {
              const table = tables.find(t => t.id === sale.table_id);
              return (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Venda #{sale.sale_number}</h4>
                      <p className="text-sm text-gray-600">Mesa {table?.number || '?'}</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(sale.total_amount)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Cliente: {sale.customer_name || 'Não informado'}</p>
                    <p>Pessoas: {sale.customer_count}</p>
                    <p>Aberta: {formatDateTime(sale.opened_at)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (table) {
                        setSelectedTable(table);
                        setCurrentSale(sale);
                      }
                    }}
                    className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Gerenciar Venda
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSalesPanel;