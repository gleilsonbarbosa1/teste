import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Save, X, Scale, Package, DollarSign, ShoppingBag, Edit3, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePDVProducts } from '../../hooks/usePDV';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { PDVProduct } from '../../types/pdv';
import { RestaurantTable, TableSale, TableSaleItem, TableCartItem } from '../../types/table-sales';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId = 1, operatorName }) => {
  console.log('🏪 TableSalesPanel iniciado para Loja:', storeId);

  // Estados principais
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [currentSale, setCurrentSale] = useState<TableSale | null>(null);
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Estados de modais
  const [showAddTable, setShowAddTable] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<PDVProduct | null>(null);
  const [productWeight, setProductWeight] = useState('');

  // Estados para nova mesa
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Hooks
  const { products } = usePDVProducts();
  const loja1CashRegister = usePDVCashRegister();
  const loja2CashRegister = useStore2PDVCashRegister();
  
  const cashRegisterHook = storeId === 1 ? loja1CashRegister : loja2CashRegister;
  const { isOpen: isCashRegisterOpen, currentRegister, addCashEntry } = cashRegisterHook;

  // Nomes das tabelas baseado na loja
  const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const itemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

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

  // Carregar mesas do banco
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔄 Carregando mesas da ${tablesTable}...`);

      if (!supabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando mesas de demonstração');
        setTables([
          { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', location: 'Área Principal', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', number: 2, name: 'Mesa 2', capacity: 6, status: 'livre', location: 'Área Principal', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', number: 3, name: 'Mesa 3', capacity: 2, status: 'livre', location: 'Área Reservada', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(tablesTable)
        .select(`
          *,
          current_sale:${salesTable}(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;

      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error('❌ Erro ao carregar mesas:', err);
      // Fallback para mesas de demonstração
      setTables([
        { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', location: 'Área Principal', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  }, [tablesTable, supabaseConfigured, storeId]);

  // Carregar venda ativa da mesa
  const loadTableSale = useCallback(async (table: RestaurantTable) => {
    if (!supabaseConfigured || !table.current_sale_id) {
      setCurrentSale(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      return;
    }

    try {
      console.log(`🔄 Carregando venda da mesa ${table.number}...`);

      const { data: sale, error: saleError } = await supabase
        .from(salesTable)
        .select(`
          *,
          items:${itemsTable}(*)
        `)
        .eq('id', table.current_sale_id)
        .eq('status', 'aberta')
        .single();

      if (saleError || !sale) {
        setCurrentSale(null);
        setCart([]);
        setCustomerName('');
        setCustomerCount(1);
        return;
      }

      setCurrentSale(sale);
      setCustomerName(sale.customer_name || '');
      setCustomerCount(sale.customer_count || 1);

      // Converter itens para o formato do carrinho
      const cartItems: TableCartItem[] = (sale.items || []).map(item => ({
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        weight: item.weight_kg,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        subtotal: item.subtotal,
        notes: item.notes
      }));

      setCart(cartItems);
      console.log(`✅ Venda carregada: ${cartItems.length} itens`);
    } catch (err) {
      console.error('❌ Erro ao carregar venda da mesa:', err);
    }
  }, [salesTable, itemsTable, supabaseConfigured]);

  // Criar nova mesa
  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Preencha número e nome da mesa');
      return;
    }

    if (!supabaseConfigured) {
      // Fallback para estado local
      const newTable: RestaurantTable = {
        id: Date.now().toString(),
        number: parseInt(newTableNumber),
        name: newTableName,
        capacity: newTableCapacity,
        status: 'livre',
        location: 'Área Principal',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTables(prev => [...prev, newTable]);
      setShowAddTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
      return;
    }

    try {
      console.log(`🚀 Criando mesa ${newTableNumber} na Loja ${storeId}...`);

      const { data, error } = await supabase
        .from(tablesTable)
        .insert([{
          number: parseInt(newTableNumber),
          name: newTableName,
          capacity: newTableCapacity,
          status: 'livre',
          location: 'Área Principal',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setTables(prev => [...prev, data]);
      setShowAddTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);

      console.log(`✅ Mesa ${newTableNumber} criada na Loja ${storeId}`);
    } catch (err) {
      console.error('❌ Erro ao criar mesa:', err);
      alert('Erro ao criar mesa. Tente novamente.');
    }
  };

  // Excluir mesa
  const deleteTable = async (tableId: string) => {
    if (!supabaseConfigured) {
      // Fallback para estado local
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
        setCart([]);
        setCustomerName('');
        setCurrentSale(null);
      }
      setTables(prev => prev.filter(t => t.id !== tableId));
      return;
    }

    try {
      console.log(`🗑️ Excluindo mesa ID ${tableId} da Loja ${storeId}...`);

      const { error } = await supabase
        .from(tablesTable)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;

      // Atualizar estado local
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
        setCart([]);
        setCustomerName('');
        setCurrentSale(null);
      }
      setTables(prev => prev.filter(t => t.id !== tableId));

      console.log(`✅ Mesa excluída da Loja ${storeId}`);
    } catch (err) {
      console.error('❌ Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa. Tente novamente.');
    }
  };

  // Alterar status da mesa
  const updateTableStatus = async (tableId: string, newStatus: RestaurantTable['status']) => {
    if (!supabaseConfigured) {
      // Fallback para estado local
      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, status: newStatus } : t
      ));
      return;
    }

    try {
      console.log(`🔄 Alterando status da mesa ${tableId} para ${newStatus}...`);

      const { error } = await supabase
        .from(tablesTable)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) throw error;

      // Atualizar estado local
      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, status: newStatus } : t
      ));

      console.log(`✅ Status da mesa atualizado para ${newStatus}`);
    } catch (err) {
      console.error('❌ Erro ao atualizar status da mesa:', err);
    }
  };

  // Adicionar produto ao carrinho
  const addToCart = (product: PDVProduct, weight?: number) => {
    console.log('🛒 Adicionando produto ao carrinho:', product.name);

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
      unit_price: product.is_weighable ? undefined : product.unit_price,
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

  // Salvar/Atualizar venda
  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim()) {
      alert('Preencha todos os dados obrigatórios');
      return;
    }

    if (!isCashRegisterOpen) {
      alert('Não é possível salvar vendas sem um caixa aberto');
      return;
    }

    setSaving(true);
    console.log(`💾 Salvando venda na mesa ${selectedTable.number} da Loja ${storeId}...`);

    try {
      const total = getCartTotal();

      if (!supabaseConfigured) {
        // Fallback: apenas adicionar ao caixa
        await addCashEntry({
          type: 'income',
          amount: total,
          description: `Venda Mesa ${selectedTable.number} - ${customerName} - Loja ${storeId}`,
          payment_method: 'dinheiro'
        });

        // Alterar status da mesa
        updateTableStatus(selectedTable.id, 'ocupada');
        
        // Limpar carrinho
        setCart([]);
        setCustomerName('');
        setCustomerCount(1);
        
        alert(`Venda da Mesa ${selectedTable.number} salva com sucesso!\nValor: ${formatPrice(total)}`);
        setSaving(false);
        return;
      }

      let saleId = currentSale?.id;

      // Criar ou atualizar venda
      if (!currentSale) {
        // Criar nova venda
        const { data: newSale, error: saleError } = await supabase
          .from(salesTable)
          .insert([{
            table_id: selectedTable.id,
            operator_name: operatorName || 'Operador',
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: total,
            discount_amount: 0,
            total_amount: total,
            status: 'aberta'
          }])
          .select()
          .single();

        if (saleError) throw saleError;
        
        saleId = newSale.id;
        setCurrentSale(newSale);

        // Atualizar mesa com a venda atual
        await supabase
          .from(tablesTable)
          .update({ 
            current_sale_id: saleId,
            status: 'ocupada'
          })
          .eq('id', selectedTable.id);

        console.log('✅ Nova venda criada:', saleId);
      } else {
        // Atualizar venda existente
        await supabase
          .from(salesTable)
          .update({
            customer_name: customerName,
            customer_count: customerCount,
            subtotal: total,
            total_amount: total,
            updated_at: new Date().toISOString()
          })
          .eq('id', saleId);

        console.log('✅ Venda atualizada:', saleId);
      }

      // Limpar itens existentes
      await supabase
        .from(itemsTable)
        .delete()
        .eq('sale_id', saleId);

      // Adicionar novos itens
      const saleItems = cart.map(item => ({
        sale_id: saleId,
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
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Adicionar entrada no caixa
      await addCashEntry({
        type: 'income',
        amount: total,
        description: `Venda Mesa ${selectedTable.number} - ${customerName} (${cart.length} itens) - Loja ${storeId}`,
        payment_method: 'dinheiro'
      });

      // Atualizar status da mesa
      await updateTableStatus(selectedTable.id, 'ocupada');

      // Recarregar mesas
      await fetchTables();

      console.log(`✅ Venda salva na mesa ${selectedTable.number} da Loja ${storeId}`);
      
      // Feedback visual
      alert(`Venda da Mesa ${selectedTable.number} salva com sucesso!\nValor: ${formatPrice(total)}`);

    } catch (err) {
      console.error('❌ Erro ao salvar venda:', err);
      alert('Erro ao salvar venda. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Fechar venda (finalizar)
  const closeSale = async () => {
    if (!currentSale || !selectedTable) return;

    if (!supabaseConfigured) {
      // Fallback
      updateTableStatus(selectedTable.id, 'livre');
      setCurrentSale(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      return;
    }

    try {
      console.log(`💰 Fechando venda da mesa ${selectedTable.number}...`);

      // Fechar venda
      await supabase
        .from(salesTable)
        .update({
          status: 'fechada',
          closed_at: new Date().toISOString()
        })
        .eq('id', currentSale.id);

      // Liberar mesa
      await supabase
        .from(tablesTable)
        .update({ 
          current_sale_id: null,
          status: 'livre'
        })
        .eq('id', selectedTable.id);

      // Limpar estado
      setCurrentSale(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);

      // Recarregar mesas
      await fetchTables();

      console.log(`✅ Venda fechada e mesa ${selectedTable.number} liberada`);
      alert(`Mesa ${selectedTable.number} liberada com sucesso!`);

    } catch (err) {
      console.error('❌ Erro ao fechar venda:', err);
      alert('Erro ao fechar venda. Tente novamente.');
    }
  };

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
      case 'aguardando_conta': return 'Aguard. Conta';
      case 'limpeza': return 'Limpeza';
      default: return status;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Carregar venda quando selecionar mesa
  useEffect(() => {
    if (selectedTable) {
      loadTableSale(selectedTable);
    } else {
      setCurrentSale(null);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
    }
  }, [selectedTable, loadTableSale]);

  const canSave = cart.length > 0 && customerName.trim() && isCashRegisterOpen && !saving;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mesas da Loja {storeId}...</p>
        </div>
      </div>
    );
  }

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
                {supabaseConfigured 
                  ? 'Sistema integrado ao banco de dados' 
                  : '⚠️ Modo demonstração - Configure Supabase para funcionalidade completa'
                }
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

          {/* Avisos importantes */}
          {!supabaseConfigured && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-yellow-600" />
                <p className="text-yellow-800 font-medium">
                  Funcionalidade limitada: Configure o Supabase para integração completa ao banco
                </p>
              </div>
            </div>
          )}

          {!isCashRegisterOpen && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-800 font-medium">
                  Caixa fechado: Abra um caixa na Loja {storeId} para poder salvar vendas
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar - Mesas */}
          <div className="space-y-6">
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
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        {table.location && (
                          <div className="text-xs text-gray-500">📍 {table.location}</div>
                        )}
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
                        onChange={(e) => updateTableStatus(table.id, e.target.value as RestaurantTable['status'])}
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

                    {/* Venda ativa */}
                    {table.current_sale_id && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <p className="text-blue-700 font-medium">💼 Venda Ativa</p>
                      </div>
                    )}
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
                  {selectedTable ? `${selectedTable.name}` : 'Selecione uma Mesa'}
                  {currentSale && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Venda #{currentSale.sale_number}
                    </span>
                  )}
                </h2>
                {selectedTable && (
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTable.status)}`}>
                      {getStatusLabel(selectedTable.status)}
                    </div>
                    {currentSale && (
                      <button
                        onClick={closeSale}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Fechar Venda
                      </button>
                    )}
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

                  {/* Total e Ações */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-semibold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(getCartTotal())}
                      </span>
                    </div>

                    <div className="space-y-3">
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
                            {currentSale ? 'Atualizar Venda' : 'Salvar Venda'} ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                          </>
                        )}
                      </button>

                      {/* Status de Validação */}
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Status de Validação:</div>
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