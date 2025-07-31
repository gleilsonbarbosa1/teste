import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Trash2, RefreshCw, AlertCircle, Clock, CheckCircle, 
  Utensils, Sparkles, ShoppingCart, X, Minus, Calculator, DollarSign,
  Save, Package, Search, Eye, Edit3, User, MapPin, Settings
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
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [isFinalizingSale, setIsFinalizingSale] = useState(false);
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    capacity: 4,
    location: ''
  });

  const { products: pdvProducts, loading: productsLoading } = usePDVProducts();
  const loja1CashRegister = usePDVCashRegister();
  const loja2CashRegister = useStore2PDVCashRegister();
  const [loadingSaleItems, setLoadingSaleItems] = useState(false);
  
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
        setTables([]);
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
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTable.number || !newTable.name) {
      alert('Número e nome da mesa são obrigatórios');
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

      await fetchTables();
      setShowCreateModal(false);
      setNewTable({ number: '', name: '', capacity: 4, location: '' });
      
    } catch (err) {
      console.error(`❌ Erro ao criar mesa na ${getStoreName()}:`, err);
      alert(`Erro ao criar mesa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: RestaurantTable['status']) => {
    try {
      const tableName = getTableName();
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
      
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
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      await fetchTables();
      
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
      setIsSavingSale(true);
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

      await fetchTables();
      setShowSaleModal(false);
      setCart([]);
      setCurrentSale(null);
      
    } catch (err) {
      console.error(`❌ Erro ao salvar venda na ${getStoreName()}:`, err);
      alert(`Erro ao salvar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsSavingSale(false);
    }
  };

  const finalizeSale = async () => {
    if (!currentSale || !selectedTable || !isCashRegisterOpen) return;

    try {
      setIsFinalizingSale(true);
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

      await fetchTables();
      setShowSaleModal(false);
      setCurrentSale(null);
      
    } catch (err) {
      console.error(`❌ Erro ao finalizar venda na ${getStoreName()}:`, err);
      alert(`Erro ao finalizar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsFinalizingSale(false);
    }
  };

  const handleFinalizeSale = async () => {
    await finalizeSale();
  };

  const handleCancelSale = async () => {
    if (!currentSale || !selectedTable) return;

    if (!confirm('Tem certeza que deseja cancelar esta venda?')) return;

    try {
      const salesTableName = getSalesTableName();
      const saleItemsTableName = getSaleItemsTableName();
      const tableName = getTableName();

      // Deletar itens da venda
      await supabase
        .from(saleItemsTableName)
        .delete()
        .eq('sale_id', currentSale.id);

      // Deletar venda
      await supabase
        .from(salesTableName)
        .delete()
        .eq('id', currentSale.id);

      // Liberar mesa
      await supabase
        .from(tableName)
        .update({ 
          current_sale_id: null,
          status: 'livre'
        })
        .eq('id', selectedTable.id);

      await fetchTables();
      setShowSaleModal(false);
      setCurrentSale(null);
      setCart([]);
      
    } catch (err) {
      console.error(`❌ Erro ao cancelar venda na ${getStoreName()}:`, err);
      alert(`Erro ao cancelar venda: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
          color: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
          textColor: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        };
      case 'ocupada':
        return {
          label: 'Ocupada',
          color: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200',
          textColor: 'text-red-800',
          icon: Users,
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        };
      case 'aguardando_conta':
        return {
          label: 'Aguardando Conta',
          color: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: Clock,
          iconColor: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'limpeza':
        return {
          label: 'Limpeza',
          color: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: Sparkles,
          iconColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200',
          textColor: 'text-gray-800',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getStatusOptions = (currentStatus: RestaurantTable['status']) => {
    const allStatuses: RestaurantTable['status'][] = ['livre', 'ocupada', 'aguardando_conta', 'limpeza'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  // Calculate finalize button state at top level to avoid conditional hook calls
  const { isFinalizeButtonDisabled, finalizeButtonTitle, finalizeButtonContent } = useMemo(() => {
    const disabled = !paymentMethod || isFinalizingSale || !cashRegisterHook.isOpen;
    const title = isFinalizingSale
      ? 'Finalizando venda...'
      : !cashRegisterHook.isOpen
      ? 'Caixa fechado. Abra o caixa para finalizar a venda.'
      : !paymentMethod
      ? 'Selecione uma forma de pagamento.'
      : '';
    
    const content = (
      <button
        onClick={handleFinalizeSale}
        disabled={disabled}
        title={title}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        <CheckCircle size={20} />
        {isFinalizingSale ? 'Finalizando...' : 'Finalizar Venda'}
      </button>
    );
    
    return { 
      isFinalizeButtonDisabled: disabled, 
      finalizeButtonTitle: title, 
      finalizeButtonContent: content 
    };
  }, [paymentMethod, isFinalizingSale, cashRegisterHook.isOpen, handleFinalizeSale]);

  useEffect(() => {
    fetchTables();
  }, [storeId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <Utensils size={24} className="absolute inset-0 m-auto text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Carregando mesas da {getStoreName()}...</p>
          <p className="text-sm text-gray-500">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Caixa Status Warning */}
      {!isCashRegisterOpen && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Caixa Fechado</h3>
              <p className="text-yellow-700">Caixa da {getStoreName()} está fechado - não é possível processar vendas</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-lg">
              <Utensils size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Vendas de Mesas
              </h1>
              <p className="text-gray-600 text-lg">{getStoreName()} • Atendimento Presencial</p>
              {operatorName && (
                <div className="flex items-center gap-2 mt-2">
                  <User size={16} className="text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">Operador: {operatorName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
              <span className="text-sm font-semibold text-indigo-700">{tables.length} Mesa(s)</span>
            </div>
            <button
              onClick={fetchTables}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <Plus size={18} />
              Nova Mesa
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Erro ao Carregar Mesas</h3>
              <p className="text-red-700">{error}</p>
              <p className="text-red-600 text-sm mt-1">Sistema funcionando em modo demonstração</p>
            </div>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="relative mb-6">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto flex items-center justify-center">
              <Utensils size={48} className="text-gray-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-indigo-500 rounded-full p-2">
              <Plus size={20} className="text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Nenhuma Mesa Encontrada</h3>
          <p className="text-gray-600 text-lg mb-6">
            Comece criando sua primeira mesa para a {getStoreName()}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Criar Primeira Mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const statusConfig = getStatusConfig(table.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={table.id}
                className={`${statusConfig.color} border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 transform cursor-pointer group`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-white/80 backdrop-blur-sm`}>
                      <StatusIcon size={24} className={statusConfig.iconColor} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${statusConfig.textColor}`}>
                        Mesa {table.number}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTable(table.id, table.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full"
                    title="Excluir mesa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Info */}
                <div className="space-y-3 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className={`font-semibold ${statusConfig.textColor}`}>{table.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Users size={14} className={statusConfig.iconColor} />
                        <span className={statusConfig.textColor}>{table.capacity} pessoas</span>
                      </div>
                      {table.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className={statusConfig.iconColor} />
                          <span className={statusConfig.textColor}>{table.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Sale Info */}
                {table.current_sale && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator size={16} className="text-green-600" />
                      <span className="font-semibold text-green-800">Venda Ativa</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">#{table.current_sale.sale_number}</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatPrice(table.current_sale.total_amount)}
                      </p>
                      {table.current_sale.customer_name && (
                        <p className="text-sm text-gray-600">{table.current_sale.customer_name}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => openSaleModal(table)}
                    disabled={!isCashRegisterOpen}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    {table.current_sale ? 'Gerenciar Venda' : 'Nova Venda'}
                  </button>
                  
                  {/* Status Quick Actions */}
                  <div className="flex gap-2">
                    {getStatusOptions(table.status).slice(0, 2).map((status) => {
                      const config = getStatusConfig(status);
                      return (
                        <button
                          key={status}
                          onClick={() => updateTableStatus(table.id, status)}
                          className="flex-1 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/50 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Plus size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Nova Mesa - {getStoreName()}</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="number"
                    value={newTable.number}
                    onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome da Mesa *
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Mesa VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Localização
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Área Central"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                disabled={!newTable.number || !newTable.name}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl">
                    <Utensils size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Mesa {selectedTable.number} - {getStoreName()}
                    </h3>
                    <p className="text-gray-600">{selectedTable.name}</p>
                    {currentSale && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                          Venda #{currentSale.sale_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Products Section */}
              <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Produtos Disponíveis</h4>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                    />
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200 group cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {product.name}
                          </h5>
                          <p className="text-sm text-gray-500 font-mono">{product.code}</p>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {product.is_weighable 
                              ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                              : formatPrice(product.unit_price || 0)
                            }
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 group-hover:from-purple-600 group-hover:to-indigo-700 text-white p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200">
                          <Plus size={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              <div className="w-1/2 p-6 flex flex-col bg-white">
                <h4 className="text-xl font-bold text-gray-800 mb-6">Carrinho da Venda</h4>
                
                {/* Loading Sale Items */}
                {loadingSaleItems && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-blue-700 font-medium">Carregando itens da venda...</span>
                    </div>
                  </div>
                )}
                
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pessoas na Mesa
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customerCount}
                        onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white resize-none"
                    rows={3}
                    placeholder="Observações sobre a venda..."
                  />
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto mb-6">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <div className="bg-gray-100 rounded-full p-8 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                        <ShoppingCart size={32} className="text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Carrinho Vazio</h4>
                      <p className="text-sm">Clique nos produtos para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-gray-800">{item.product_name}</h5>
                            <button
                              onClick={() => setCart(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 font-mono">Código: {item.product_code}</p>
                            {item.weight && (
                              <p className="text-sm text-gray-600">Peso: {item.weight}kg</p>
                            )}
                            {item.notes && (
                              <p className="text-sm text-gray-500 italic">Obs: {item.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 bg-white rounded-lg p-2 border border-gray-200">
                              <button
                                onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                                className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                                className="bg-green-100 hover:bg-green-200 text-green-600 rounded-full p-1 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="text-xl font-bold text-green-600">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                          
                          {/* Item price breakdown */}
                          <div className="mt-2 text-xs text-gray-500">
                            {item.price_per_gram ? (
                              <span>
                                {formatPrice(item.price_per_gram * 1000)}/kg × {item.weight || 0}kg × {item.quantity}
                              </span>
                            ) : (
                              <span>
                                {formatPrice(item.unit_price || 0)} × {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {currentSale && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                    >
                      <option value="dinheiro">💵 Dinheiro</option>
                      <option value="pix">📱 PIX</option>
                      <option value="cartao_credito">💳 Cartão de Crédito</option>
                      <option value="cartao_debito">💳 Cartão de Débito</option>
                      <option value="voucher">🎫 Voucher</option>
                      <option value="misto">🔀 Misto</option>
                    </select>

                    {paymentMethod === 'dinheiro' && (
                      <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Troco para
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={changeFor || ''}
                          onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                          placeholder="Valor para troco"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-800">Total:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatPrice(calculateCartTotal())}
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {cart.length} item(ns) • Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!currentSale ? (
                    <>
                      <button
                        onClick={() => setShowSaleModal(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={createOrUpdateSale}
                        disabled={cart.length === 0 || !isCashRegisterOpen || isSavingSale}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        {isSavingSale ? 'Criando...' : 'Criar Venda'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={createOrUpdateSale}
                        disabled={cart.length === 0 || isSavingSale || isFinalizingSale}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        {isSavingSale ? 'Salvando...' : 'Salvar Alterações'}
                      </button>

                      {finalizeButtonContent}

                      <button
                        onClick={handleCancelSale}
                        disabled={isSavingSale || isFinalizingSale}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={20} />
                        Cancelar Venda
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowSaleModal(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Voltar
                  </button>
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