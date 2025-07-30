import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3,
  Search,
  Package,
  Scale,
  ShoppingCart,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Minus,
  User,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { RestaurantTable, TableSale, TableCartItem } from '../../types/table-sales';
import { PDVProduct } from '../../types/pdv';
import { usePDVCashRegister } from '../../hooks/usePDVCashRegister';
import { useStore2PDVCashRegister } from '../../hooks/useStore2PDVCashRegister';
import { usePDVProducts } from '../../hooks/usePDV';
import { useStore2Products } from '../../hooks/useStore2Products';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  // Estado das mesas
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos modais
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<PDVProduct | null>(null);

  // Estados do formulário de mesa
  const [newTable, setNewTable] = useState({
    number: 1,
    name: '',
    capacity: 4,
    location: ''
  });

  // Estados da venda
  const [cart, setCart] = useState<TableCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentType, setPaymentType] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>();
  const [productWeight, setProductWeight] = useState('');

  // Estados de busca de produtos
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks específicos por loja
  const { 
    isOpen: isCashRegisterOpen1, 
    currentRegister: currentRegister1 
  } = usePDVCashRegister();
  
  const { 
    isOpen: isCashRegisterOpen2, 
    currentRegister: currentRegister2 
  } = useStore2PDVCashRegister();
  
  const { products: products1 } = usePDVProducts();
  const { products: products2 } = useStore2Products();

  // Determinar qual caixa e produtos usar baseado na loja
  const isCashRegisterOpen = storeId === 1 ? isCashRegisterOpen1 : isCashRegisterOpen2;
  const currentRegister = storeId === 1 ? currentRegister1 : currentRegister2;
  const products = storeId === 1 ? products1 : products2.map(p => ({
    ...p,
    category: p.category as any
  }));

  // Tabela do banco baseada na loja
  const tableDbName = storeId === 1 ? 'store1_tables' : 'store2_tables';
  const saleDbName = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
  const saleItemsDbName = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

  // Carregar mesas
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Dados de demonstração
        const demoTables: RestaurantTable[] = [
          {
            id: '1',
            number: 1,
            name: 'Mesa 1',
            capacity: 4,
            status: 'livre',
            is_active: true,
            location: 'Área Principal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2', 
            number: 2,
            name: 'Mesa 2',
            capacity: 6,
            status: 'ocupada',
            is_active: true,
            location: 'Área Principal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setTables(demoTables);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(tableDbName)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  }, [tableDbName]);

  // Criar mesa
  const createTable = async () => {
    try {
      // Validar se já existe mesa com esse número
      const existingTable = tables.find(t => t.number === newTable.number);
      if (existingTable) {
        alert(`Já existe uma mesa com o número ${newTable.number}. Escolha outro número.`);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        // Demo - adicionar mesa local
        const demoTable: RestaurantTable = {
          id: Date.now().toString(),
          number: newTable.number,
          name: newTable.name || `Mesa ${newTable.number}`,
          capacity: newTable.capacity,
          status: 'livre',
          is_active: true,
          location: newTable.location,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTables(prev => [...prev, demoTable]);
        setShowCreateTable(false);
        setNewTable({ number: 1, name: '', capacity: 4, location: '' });
        return;
      }

      const { data, error } = await supabase
        .from(tableDbName)
        .insert([{
          number: newTable.number,
          name: newTable.name || `Mesa ${newTable.number}`,
          capacity: newTable.capacity,
          location: newTable.location,
          status: 'livre',
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
      setShowCreateTable(false);
      setNewTable({ number: 1, name: '', capacity: 4, location: '' });
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert('Erro ao criar mesa. Tente novamente.');
    }
  };

  // Atualizar status da mesa
  const updateTableStatus = async (tableId: string, status: RestaurantTable['status']) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        setTables(prev => prev.map(t => 
          t.id === tableId ? { ...t, status } : t
        ));
        return;
      }

      const { error } = await supabase
        .from(tableDbName)
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, status } : t
      ));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Excluir mesa
  const deleteTable = async (tableId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        return;
      }

      const { error } = await supabase
        .from(tableDbName)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;
      setTables(prev => prev.filter(t => t.id !== tableId));
    } catch (err) {
      console.error('Erro ao excluir mesa:', err);
    }
  };

  // Gerenciar carrinho
  const addToCart = (product: PDVProduct, weight?: number) => {
    if (product.is_weighable && !weight) {
      setSelectedProductForWeight(product);
      setShowWeightModal(true);
      return;
    }

    const quantity = product.is_weighable ? 1 : 1;
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

    setCart(prev => [...prev, newItem]);
  };

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

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const unitPrice = item.unit_price || 0;
        return {
          ...item,
          quantity,
          subtotal: unitPrice * quantity
        };
      }
      return item;
    }));
  };

  // Calcular total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  // Salvar venda
  const saveSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName.trim()) return;

    try {
      if (!isCashRegisterOpen) {
        alert('Não é possível realizar vendas sem um caixa aberto');
        return;
      }

      const total = getCartTotal();
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        alert('Venda simulada salva com sucesso!');
        await updateTableStatus(selectedTable.id, 'ocupada');
        setShowSaleModal(false);
        clearSaleForm();
        return;
      }

      // Criar venda na mesa
      const { data: sale, error: saleError } = await supabase
        .from(saleDbName)
        .insert([{
          table_id: selectedTable.id,
          operator_name: operatorName || 'Operador',
          customer_name: customerName,
          customer_count: customerCount,
          subtotal: total,
          total_amount: total,
          status: 'aberta'
        }])
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
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from(saleItemsDbName)
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar status da mesa
      await updateTableStatus(selectedTable.id, 'ocupada');

      alert('Venda iniciada com sucesso!');
      setShowSaleModal(false);
      clearSaleForm();
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      alert('Erro ao salvar venda. Tente novamente.');
    }
  };

  const clearSaleForm = () => {
    setCart([]);
    setCustomerName('');
    setCustomerCount(1);
    setPaymentType('dinheiro');
    setChangeFor(undefined);
    setSelectedTable(null);
  };

  // Filtrar produtos por busca
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Vendas nas Mesas - Loja {storeId}
          </h2>
          <p className="text-gray-600">Gerencie vendas presenciais por mesa</p>
        </div>
        <button
          onClick={() => setShowCreateTable(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Mesa
        </button>
      </div>

      {/* Status do Caixa */}
      {!isCashRegisterOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Caixa Fechado - Loja {storeId}</h3>
              <p className="text-yellow-700 text-sm">
                Não é possível realizar vendas sem um caixa aberto. Abra o caixa na aba "Caixas".
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(table.status)}`}
          >
            {/* Número da Mesa */}
            <div className="text-center mb-3">
              <div className="text-2xl font-bold">{table.number}</div>
              <div className="text-sm font-medium">{table.name}</div>
            </div>

            {/* Status */}
            <div className="text-center mb-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/70">
                {getStatusLabel(table.status)}
              </span>
            </div>

            {/* Informações */}
            <div className="text-center text-xs text-gray-600 mb-3">
              <div>👥 {table.capacity} pessoas</div>
              {table.location && <div>📍 {table.location}</div>}
            </div>

            {/* Ações */}
            <div className="space-y-2">
              {table.status === 'livre' && (
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setShowSaleModal(true);
                  }}
                  disabled={!isCashRegisterOpen}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  Nova Venda
                </button>
              )}

              {table.status === 'ocupada' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'aguardando_conta')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  Pedir Conta
                </button>
              )}

              {table.status === 'aguardando_conta' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'limpeza')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  Finalizar
                </button>
              )}

              {table.status === 'limpeza' && (
                <button
                  onClick={() => updateTableStatus(table.id, 'livre')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  Marcar Livre
                </button>
              )}

              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir a ${table.name}?`)) {
                      deleteTable(table.id);
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma mesa cadastrada na Loja {storeId}</p>
          <button
            onClick={() => setShowCreateTable(true)}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Criar Primeira Mesa
          </button>
        </div>
      )}

      {/* Modal Criar Mesa */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Mesa - Loja {storeId}</h3>
              <button
                onClick={() => setShowCreateTable(false)}
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
                  min="1"
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Mesa ${newTable.number}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  value={newTable.capacity}
                  onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização (opcional)
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Área Principal, Varanda..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTable(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors"
              >
                Criar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venda */}
      {showSaleModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Venda - {selectedTable.name} (Loja {storeId})
                </h3>
                <button
                  onClick={() => {
                    setShowSaleModal(false);
                    clearSaleForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Produtos (30%) */}
              <div className="w-[30%] border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
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
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-400 flex-shrink-0" />
                            {product.is_weighable && <Scale size={14} className="text-orange-500 flex-shrink-0" />}
                          </div>
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.code}
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {product.is_weighable 
                              ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                              : formatPrice(product.unit_price || 0)
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carrinho (70%) */}
              <div className="w-[70%] flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
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
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Carrinho vazio</p>
                      <p className="text-gray-400 text-sm">Adicione produtos da lista ao lado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 mb-1">
                                {item.product_name}
                              </div>
                              <div className="text-sm text-gray-500 mb-2">
                                Código: {item.product_code}
                              </div>
                              
                              {item.weight && (
                                <div className="text-sm text-orange-600 mb-2">
                                  ⚖️ Peso: {item.weight}kg
                                </div>
                              )}

                              <div className="flex items-center gap-3">
                                {!item.weight && ( // Só mostra controles se não for pesável
                                  <>
                                    <button
                                      onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                      className="bg-gray-100 hover:bg-gray-200 p-1 rounded transition-colors"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="font-medium w-8 text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                      className="bg-gray-100 hover:bg-gray-200 p-1 rounded transition-colors"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </>
                                )}
                                
                                {item.weight && (
                                  <span className="text-sm text-gray-600">
                                    Qtd: {item.quantity}x
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-green-600 text-lg mb-2">
                                {formatPrice(item.subtotal)}
                              </div>
                              <button
                                onClick={() => removeFromCart(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
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

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
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
                  
                  {!isCashRegisterOpen && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Caixa fechado - não é possível salvar vendas
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Peso */}
      {showWeightModal && selectedProductForWeight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Scale size={20} className="text-orange-500" />
                Informar Peso
              </h3>
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
                <p className="text-xs text-gray-500 mt-1">
                  Digite o peso em quilogramas (kg)
                </p>
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
            </div>

            <div className="flex gap-3 mt-6">
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
      )}
    </div>
  );
};

export default TableSalesPanel;