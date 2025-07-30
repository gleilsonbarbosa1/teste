import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  DollarSign, 
  Save, 
  X,
  Edit3,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: 1 | 2;
  operatorName?: string;
}

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  location?: string;
  is_active: boolean;
  current_sale_id?: string;
  current_sale?: any;
}

interface CartItem {
  code: string;
  name: string;
  quantity: number;
  weight?: number;
  unit_price?: number;
  price_per_gram?: number;
  subtotal: number;
  is_weighable: boolean;
}

const TableSalesPanel: React.FC<TableSalesPanelProps> = ({ storeId, operatorName }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  // Produtos de demonstração completos
  const demoProducts = [
    // AÇAÍ
    { code: 'ACAI300', name: 'Açaí 300ml', category: 'acai', price: 15.90, is_weighable: false },
    { code: 'ACAI400', name: 'Açaí 400ml', category: 'acai', price: 18.90, is_weighable: false },
    { code: 'ACAI500', name: 'Açaí 500ml', category: 'acai', price: 22.90, is_weighable: false },
    { code: 'ACAI600', name: 'Açaí 600ml', category: 'acai', price: 26.90, is_weighable: false },
    { code: 'ACAI700', name: 'Açaí 700ml', category: 'acai', price: 31.90, is_weighable: false },
    { code: 'ACAI1KG', name: 'Açaí 1kg', category: 'acai', price_per_gram: 0.04499, is_weighable: true },
    
    // COMBOS
    { code: 'COMBO1', name: 'Combo Casal (1kg + Milkshake)', category: 'combo', price: 49.99, is_weighable: false },
    { code: 'COMBO2', name: 'Combo 4 (900g)', category: 'combo', price: 42.99, is_weighable: false },
    { code: 'COMBO3', name: 'Combo Família (1.5kg)', category: 'combo', price: 65.99, is_weighable: false },
    
    // MILKSHAKES
    { code: 'MILK400', name: 'Milkshake 400ml', category: 'bebidas', price: 11.99, is_weighable: false },
    { code: 'MILK500', name: 'Milkshake 500ml', category: 'bebidas', price: 14.99, is_weighable: false },
    
    // VITAMINAS
    { code: 'VIT400', name: 'Vitamina Açaí 400ml', category: 'bebidas', price: 12.00, is_weighable: false },
    { code: 'VIT500', name: 'Vitamina Açaí 500ml', category: 'bebidas', price: 15.00, is_weighable: false },
    
    // SORVETES
    { code: 'SORV1KG', name: 'Sorvete 1kg', category: 'sorvetes', price_per_gram: 0.04499, is_weighable: true },
    { code: 'SORV500', name: 'Sorvete 500ml', category: 'sorvetes', price: 22.90, is_weighable: false },
    
    // COMPLEMENTOS
    { code: 'GRAN100', name: 'Granola 100g', category: 'complementos', price: 3.50, is_weighable: false },
    { code: 'LEITE100', name: 'Leite em Pó 100g', category: 'complementos', price: 4.00, is_weighable: false },
    { code: 'PACOCA', name: 'Paçoca Triturada', category: 'complementos', price: 2.50, is_weighable: false },
    
    // SOBREMESAS
    { code: 'BROWNIE', name: 'Brownie', category: 'sobremesas', price: 8.50, is_weighable: false },
    { code: 'PUDIM', name: 'Pudim', category: 'sobremesas', price: 6.50, is_weighable: false }
  ];

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'acai', label: 'Açaí' },
    { id: 'combo', label: 'Combos' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' }
  ];

  // Check Supabase configuration
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    setIsSupabaseConfigured(isConfigured);
    
    if (isConfigured) {
      loadTables();
      loadProducts();
    } else {
      // Mesas de demonstração
      setTables([
        { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: '2', number: 2, name: 'Mesa 2', capacity: 6, status: 'ocupada', is_active: true },
        { id: '3', number: 3, name: 'Mesa 3', capacity: 4, status: 'livre', is_active: true },
        { id: '4', number: 4, name: 'Mesa 4', capacity: 8, status: 'livre', is_active: true }
      ]);
      setProducts(demoProducts);
      setLoading(false);
    }
  }, [storeId]);

  const loadProducts = async () => {
    try {
      const productsTable = storeId === 1 ? 'pdv_products' : 'store2_products';
      
      const { data, error } = await supabase
        .from(productsTable)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.warn('Erro ao carregar produtos do banco, usando demonstração:', error);
        setProducts(demoProducts);
        return;
      }
      
      const formattedProducts = (data || []).map(product => ({
        code: product.code,
        name: product.name,
        category: product.category,
        price: product.unit_price,
        price_per_gram: product.price_per_gram,
        is_weighable: product.is_weighable
      }));
      
      setProducts(formattedProducts.length > 0 ? formattedProducts : demoProducts);
      console.log(`✅ ${formattedProducts.length} produtos carregados da Loja ${storeId}`);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setProducts(demoProducts);
    }
  };

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';

      const { data, error } = await supabase
        .from(tablesTable)
        .select('*')
        .eq('is_active', true)
        .order('number');

      if (error) {
        console.error('❌ Erro ao carregar mesas:', error);
        throw error;
      }

      setTables(data || []);
      console.log(`✅ ${data?.length || 0} mesas carregadas da Loja ${storeId}`);
    } catch (err) {
      console.error('❌ Erro ao carregar mesas:', err);
      // Fallback para mesas de demonstração
      setTables([
        { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: '2', number: 2, name: 'Mesa 2', capacity: 6, status: 'ocupada', is_active: true },
        { id: '3', number: 3, name: 'Mesa 3', capacity: 4, status: 'livre', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber || !newTableName) {
      alert('Número e nome da mesa são obrigatórios');
      return;
    }

    try {
      const tableNumber = parseInt(newTableNumber);
      
      // Verificar se número já existe
      const existingTable = tables.find(t => t.number === tableNumber);
      if (existingTable) {
        alert(`Mesa número ${tableNumber} já existe. Escolha outro número.`);
        return;
      }

      if (!isSupabaseConfigured) {
        // Modo demonstração
        const newTable: RestaurantTable = {
          id: Date.now().toString(),
          number: tableNumber,
          name: newTableName,
          capacity: newTableCapacity,
          status: 'livre',
          is_active: true
        };
        setTables(prev => [...prev, newTable].sort((a, b) => a.number - b.number));
        setShowCreateTable(false);
        setNewTableNumber('');
        setNewTableName('');
        setNewTableCapacity(4);
        return;
      }

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

      if (error) {
        console.error('❌ Erro ao criar mesa:', error);
        if (error.code === '23505') {
          alert(`Mesa número ${tableNumber} já existe. Escolha outro número.`);
        } else {
          alert('Erro ao criar mesa. Tente novamente.');
        }
        return;
      }

      setTables(prev => [...prev, data].sort((a, b) => a.number - b.number));
      setShowCreateTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
      
      console.log('✅ Mesa criada com sucesso:', data);
    } catch (err) {
      console.error('❌ Erro ao criar mesa:', err);
      alert('Erro ao criar mesa. Tente novamente.');
    }
  };

  const deleteTable = async (tableId: string, tableNumber: number) => {
    if (!confirm(`Tem certeza que deseja excluir a Mesa ${tableNumber}?`)) {
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        return;
      }

      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tablesTable)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.id !== tableId));
      console.log('✅ Mesa excluída com sucesso');
    } catch (err) {
      console.error('❌ Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa. Tente novamente.');
    }
  };

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      if (!isSupabaseConfigured) {
        setTables(prev => prev.map(t => 
          t.id === tableId ? { ...t, status: newStatus as any } : t
        ));
        return;
      }

      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tablesTable)
        .update({ status: newStatus })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, status: newStatus as any } : t
      ));
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.code === product.code);
    
    if (existingItem) {
      setCart(prev => prev.map(item => 
        item.code === product.code 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * (item.unit_price || 0) }
          : item
      ));
    } else {
      const newItem: CartItem = {
        code: product.code,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
        price_per_gram: product.price_per_gram,
        subtotal: product.price || 0,
        is_weighable: product.is_weighable || false
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.code !== code));
  };

  const updateCartQuantity = (code: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(code);
      return;
    }

    setCart(prev => prev.map(item => 
      item.code === code 
        ? { ...item, quantity, subtotal: quantity * (item.unit_price || 0) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const finalizeSale = async () => {
    if (!selectedTable || cart.length === 0 || !customerName) {
      alert('Preencha todos os dados para finalizar a venda');
      return;
    }

    try {
      const total = getCartTotal();
      
      if (!isSupabaseConfigured) {
        // Modo demonstração
        alert(`Venda finalizada!\nMesa: ${selectedTable.name}\nTotal: R$ ${total.toFixed(2)}`);
        setCart([]);
        setCustomerName('');
        setCustomerCount(1);
        setSelectedTable(null);
        return;
      }

      // Dados da venda
      const saleData = {
        table_id: selectedTable.id,
        operator_name: operatorName || 'Sistema',
        customer_name: customerName,
        customer_count: customerCount,
        subtotal: total,
        discount_amount: 0,
        total_amount: total,
        payment_type: paymentMethod,
        change_amount: changeFor || 0,
        status: 'fechada'
      };

      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      
      // Criar venda
      const { data: sale, error: saleError } = await supabase
        .from(salesTable)
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda
      const saleItemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';
      const items = cart.map(item => ({
        sale_id: sale.id,
        product_code: item.code,
        product_name: item.name,
        quantity: item.quantity,
        weight_kg: item.weight,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        discount_amount: 0,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from(saleItemsTable)
        .insert(items);

      if (itemsError) throw itemsError;

      // Atualizar status da mesa
      await updateTableStatus(selectedTable.id, 'livre');

      // Limpar formulário
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      setSelectedTable(null);
      
      alert(`✅ Venda finalizada com sucesso!\nTotal: R$ ${total.toFixed(2)}`);
      console.log('✅ Venda da mesa finalizada:', sale);
      
    } catch (err) {
      console.error('❌ Erro ao finalizar venda:', err);
      alert('Erro ao finalizar venda. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      livre: 'bg-green-100 text-green-800 border-green-200',
      ocupada: 'bg-red-100 text-red-800 border-red-200',
      aguardando_conta: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      limpeza: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      livre: 'Livre',
      ocupada: 'Ocupada',
      aguardando_conta: 'Aguard. Conta',
      limpeza: 'Limpeza'
    };
    return labels[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mesas da Loja {storeId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Users size={32} className="text-indigo-600" />
              Vendas por Mesa - Loja {storeId}
            </h1>
            <p className="text-gray-600 mt-1">
              {operatorName && `Operador: ${operatorName} • `}
              {tables.length} mesa(s) • {products.length} produto(s)
            </p>
          </div>
          <button
            onClick={() => setShowCreateTable(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Mesa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mesas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users size={24} className="text-indigo-600" />
                Mesas da Loja {storeId}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div key={table.id} className="relative">
                    <button
                      onClick={() => setSelectedTable(table)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedTable?.id === table.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">{table.name}</div>
                        <div className="text-sm text-gray-600">
                          {table.capacity} lugares
                        </div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(table.status)}`}>
                          {getStatusLabel(table.status)}
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => deleteTable(table.id, table.number)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingCart size={24} className="text-green-600" />
                {selectedTable ? `${selectedTable.name}` : 'Selecione uma Mesa'}
              </h2>

              {selectedTable && (
                <>
                  {/* Status da Mesa */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Status da Mesa:</span>
                      <select
                        value={selectedTable.status}
                        onChange={(e) => updateTableStatus(selectedTable.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="livre">Livre</option>
                        <option value="ocupada">Ocupada</option>
                        <option value="aguardando_conta">Aguard. Conta</option>
                        <option value="limpeza">Limpeza</option>
                      </select>
                    </div>
                  </div>

                  {/* Dados do Cliente */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente
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
                        Quantidade de Pessoas
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

                  {/* Produtos */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Produtos ({filteredProducts.length})
                      </h3>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.code}
                          onClick={() => addToCart(product)}
                          className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                        >
                          <div className="font-medium text-sm text-gray-800 truncate">{product.name}</div>
                          <div className="text-green-600 font-semibold text-sm">
                            {product.is_weighable 
                              ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                              : formatPrice(product.price || 0)
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carrinho */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Carrinho</h3>
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Carrinho vazio</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.code} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-green-600 text-sm">{formatPrice(item.subtotal)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartQuantity(item.code, item.quantity - 1)}
                                className="w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(item.code, item.quantity + 1)}
                                className="w-6 h-6 bg-green-500 text-white rounded-full text-xs hover:bg-green-600"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.code)}
                                className="w-6 h-6 bg-gray-500 text-white rounded-full text-xs hover:bg-gray-600 ml-1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Forma de Pagamento */}
                  {cart.length > 0 && (
                    <div className="mb-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="cartao_debito">Cartão de Débito</option>
                          <option value="voucher">Voucher</option>
                          <option value="misto">Misto</option>
                        </select>
                      </div>

                      {paymentMethod === 'dinheiro' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Troco para (opcional)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={changeFor || ''}
                            onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Valor para troco"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total e Finalizar */}
                  {cart.length > 0 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">{formatPrice(getCartTotal())}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={finalizeSale}
                        disabled={!customerName || cart.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        Finalizar Venda
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Criar Mesa */}
        {showCreateTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Nova Mesa - Loja {storeId}</h3>
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
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

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateTable(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createTable}
                    disabled={!newTableNumber || !newTableName}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Criar Mesa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableSalesPanel;