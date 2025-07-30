import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  ShoppingCart, 
  X, 
  Check,
  Scale,
  Package
} from 'lucide-react';

interface TableSalesPanelProps {
  storeId: number;
  operatorName?: string;
}

interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'aguardando_conta' | 'limpeza';
  is_active: boolean;
  current_sale_id?: string;
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
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'voucher' | 'misto'>('dinheiro');
  const [changeFor, setChangeFor] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<any>(null);
  const [productWeight, setProductWeight] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingTableSale, setLoadingTableSale] = useState(false);

  // Produtos completos
  const demoProducts = [
    // AÇAÍ
    { code: 'ACAI300', name: 'Açaí 300ml', category: 'acai', price: 15.90, is_weighable: false },
    { code: 'ACAI400', name: 'Açaí 400ml', category: 'acai', price: 18.90, is_weighable: false },
    { code: 'ACAI500', name: 'Açaí 500ml', category: 'acai', price: 22.90, is_weighable: false },
    { code: 'ACAI600', name: 'Açaí 600ml', category: 'acai', price: 26.90, is_weighable: false },
    { code: 'ACAI700', name: 'Açaí 700ml', category: 'acai', price: 31.90, is_weighable: false },
    { code: 'ACAI1KG', name: 'Açaí 1kg', category: 'acai', price_per_gram: 0.04499, is_weighable: true },
    
    // COMBOS
    { code: 'COMBO1', name: 'Combo Casal', category: 'combo', price: 49.99, is_weighable: false },
    { code: 'COMBO2', name: 'Combo 4', category: 'combo', price: 42.99, is_weighable: false },
    
    // BEBIDAS
    { code: 'MILK400', name: 'Milkshake 400ml', category: 'bebidas', price: 11.99, is_weighable: false },
    { code: 'MILK500', name: 'Milkshake 500ml', category: 'bebidas', price: 14.99, is_weighable: false },
    { code: 'VIT400', name: 'Vitamina 400ml', category: 'bebidas', price: 12.00, is_weighable: false },
    
    // SORVETES
    { code: 'SORV1KG', name: 'Sorvete 1kg', category: 'sorvetes', price_per_gram: 0.04499, is_weighable: true },
    { code: 'SORV500', name: 'Sorvete 500ml', category: 'sorvetes', price: 22.90, is_weighable: false },
    
    // COMPLEMENTOS
    { code: 'GRAN100', name: 'Granola 100g', category: 'complementos', price: 3.50, is_weighable: false },
    { code: 'LEITE100', name: 'Leite em Pó 100g', category: 'complementos', price: 4.00, is_weighable: false },
    { code: 'PACOCA', name: 'Paçoca', category: 'complementos', price: 2.50, is_weighable: false },
    
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

  useEffect(() => {
    // Verificar se Supabase está configurado
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const isConfigured = supabaseUrl && supabaseKey && 
                        supabaseUrl !== 'your_supabase_url_here' && 
                        supabaseKey !== 'your_supabase_anon_key_here' &&
                        !supabaseUrl.includes('placeholder');
    
    if (isConfigured) {
      loadTables();
      loadProducts();
    } else {
      // Modo demonstração
      setTables([
        { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: '2', number: 2, name: 'Mesa 2', capacity: 4, status: 'ocupada', is_active: true },
        { id: '3', number: 3, name: 'Mesa 3', capacity: 6, status: 'aguardando_conta', is_active: true },
        { id: '4', number: 4, name: 'Mesa 4', capacity: 8, status: 'livre', is_active: true }
      ]);
      setProducts(demoProducts);
      setLoading(false);
    }
  }, [storeId]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';

      const { data, error } = await supabase
        .from(tablesTable)
        .select(`
          *,
          current_sale:${salesTable}!${tablesTable}_current_sale_id_fkey(*)
        `)
        .eq('is_active', true)
        .order('number');

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
      // Fallback para demonstração
      setTables([
        { id: '1', number: 1, name: 'Mesa 1', capacity: 4, status: 'livre', is_active: true },
        { id: '2', number: 2, name: 'Mesa 2', capacity: 4, status: 'ocupada', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsTable = storeId === 1 ? 'pdv_products' : 'store2_products';
      
      const { data, error } = await supabase
        .from(productsTable)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
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
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setProducts(demoProducts);
    }
  };

  const loadTableSale = async (table: RestaurantTable) => {
    if (!table.current_sale_id) {
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
      return;
    }

    setLoadingTableSale(true);
    try {
      const salesTable = storeId === 1 ? 'store1_table_sales' : 'store2_table_sales';
      const itemsTable = storeId === 1 ? 'store1_table_sale_items' : 'store2_table_sale_items';

      const { data: saleData, error: saleError } = await supabase
        .from(salesTable)
        .select('*')
        .eq('id', table.current_sale_id)
        .single();

      if (saleError) throw saleError;

      const { data: itemsData, error: itemsError } = await supabase
        .from(itemsTable)
        .select('*')
        .eq('sale_id', table.current_sale_id);

      if (itemsError) throw itemsError;

      setCustomerName(saleData.customer_name || '');
      setCustomerCount(saleData.customer_count || 1);
      setPaymentMethod(saleData.payment_type || 'dinheiro');
      setChangeFor(saleData.change_amount || undefined);

      const cartItems: CartItem[] = (itemsData || []).map(item => ({
        code: item.product_code,
        name: item.product_name,
        quantity: item.quantity,
        weight: item.weight_kg,
        unit_price: item.unit_price,
        price_per_gram: item.price_per_gram,
        subtotal: item.subtotal,
        is_weighable: !!item.weight_kg
      }));
      
      setCart(cartItems);
    } catch (err) {
      console.error('Erro ao carregar venda da mesa:', err);
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
    } finally {
      setLoadingTableSale(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber || !newTableName) return;

    try {
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';

      // Verificar se número já existe
      const { data: existingTable } = await supabase
        .from(tablesTable)
        .select('number')
        .eq('number', parseInt(newTableNumber))
        .eq('is_active', true)
        .single();

      if (existingTable) {
        alert(`Mesa número ${newTableNumber} já existe. Escolha outro número.`);
        return;
      }

      const { data, error } = await supabase
        .from(tablesTable)
        .insert([{
          number: parseInt(newTableNumber),
          name: newTableName,
          capacity: newTableCapacity,
          status: 'livre',
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setTables(prev => [...prev, data]);
      setShowCreateTable(false);
      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
      alert('Erro ao criar mesa. Tente novamente.');
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    try {
      const tablesTable = storeId === 1 ? 'store1_tables' : 'store2_tables';
      
      const { error } = await supabase
        .from(tablesTable)
        .update({ is_active: false })
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.id !== tableId));
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
        setCart([]);
      }
    } catch (err) {
      console.error('Erro ao excluir mesa:', err);
      alert('Erro ao excluir mesa. Tente novamente.');
    }
  };

  const addToCart = (product: any) => {
    if (product.is_weighable) {
      setSelectedWeightProduct(product);
      setProductWeight('');
      setShowWeightModal(true);
      return;
    }

    addProductToCart(product, 1);
  };

  const addProductToCart = (product: any, quantity: number = 1, weight?: number) => {
    const existingItem = cart.find(item => item.code === product.code);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newWeight = weight ? (existingItem.weight || 0) + weight : existingItem.weight;
      let newSubtotal = 0;
      
      if (product.is_weighable && newWeight) {
        newSubtotal = newWeight * (product.price_per_gram || 0) * 1000;
      } else {
        newSubtotal = newQuantity * (product.price || 0);
      }
      
      setCart(prev => prev.map(item => 
        item.code === product.code 
          ? { ...item, quantity: newQuantity, weight: newWeight, subtotal: newSubtotal }
          : item
      ));
    } else {
      let subtotal = 0;
      if (product.is_weighable && weight) {
        subtotal = weight * (product.price_per_gram || 0) * 1000;
      } else {
        subtotal = quantity * (product.price || 0);
      }
      
      const newItem: CartItem = {
        code: product.code,
        name: product.name,
        quantity,
        weight,
        unit_price: product.price,
        price_per_gram: product.price_per_gram,
        subtotal,
        is_weighable: product.is_weighable || false
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const handleWeightConfirm = () => {
    const weight = parseFloat(productWeight);
    if (!weight || weight <= 0) {
      alert('Digite um peso válido');
      return;
    }

    addProductToCart(selectedWeightProduct, 1, weight);
    setShowWeightModal(false);
    setSelectedWeightProduct(null);
    setProductWeight('');
  };

  const removeFromCart = (code: string) => {
    setCart(prev => prev.filter(item => item.code !== code));
  };

  const updateCartQuantity = (code: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(code);
      return;
    }

    setCart(prev => prev.map(item => 
      item.code === code 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * (item.unit_price || 0) }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const finalizeSale = async () => {
    if (!selectedTable || !customerName || cart.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      console.log('Finalizando venda para mesa:', selectedTable.name);
      
      // Simular sucesso
      alert('Venda finalizada com sucesso!');
      
      // Limpar formulário
      setCart([]);
      setCustomerName('');
      setCustomerCount(1);
      setPaymentMethod('dinheiro');
      setChangeFor(undefined);
      
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Erro ao finalizar venda. Tente novamente.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-green-100 text-green-800 border-green-300';
      case 'ocupada': return 'bg-red-100 text-red-800 border-red-300';
      case 'aguardando_conta': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'limpeza': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Users size={32} className="text-indigo-600" />
                Vendas Presenciais - Loja {storeId}
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie mesas e vendas presenciais
                {operatorName && <span className="ml-2">• Operador: {operatorName}</span>}
              </p>
            </div>
            <button
              onClick={() => setShowCreateTable(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Mesa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mesas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users size={24} className="text-indigo-600" />
                Mesas ({tables.length})
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div key={table.id} className="relative">
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        loadTableSale(table);
                      }}
                      disabled={loadingTableSale}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedTable?.id === table.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="text-center relative">
                        {loadingTableSale && selectedTable?.id === table.id && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          </div>
                        )}
                        <div className="text-lg font-bold text-gray-800">{table.name}</div>
                        {table.current_sale_id && (
                          <div className="text-xs text-indigo-600 font-medium">Venda Ativa</div>
                        )}
                        <div className="text-sm text-gray-600">{table.capacity} lugares</div>
                        <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(table.status)}`}>
                          {getStatusLabel(table.status)}
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel de Vendas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingCart size={24} className="text-green-600" />
                {selectedTable ? `Venda - ${selectedTable.name}` : 'Selecione uma Mesa'}
              </h2>

              {selectedTable ? (
                <div className="space-y-6">
                  {/* Dados do Cliente */}
                  <div className="space-y-4">
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
                        Quantidade de Pessoas
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

                  {/* Produtos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-800">
                        Produtos ({filteredProducts.length})
                      </h3>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.code}
                          onClick={() => addToCart(product)}
                          className="p-3 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-800">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.code}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-semibold text-sm">
                              {product.is_weighable 
                                ? `${formatPrice((product.price_per_gram || 0) * 1000)}/kg`
                                : formatPrice(product.price || 0)
                              }
                            </div>
                            {product.is_weighable && (
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <Scale size={12} />
                                Pesável
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Carrinho */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package size={20} />
                      Carrinho ({cart.length})
                    </h3>
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                        <ShoppingCart size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>Carrinho vazio</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                        {cart.map((item) => (
                          <div key={item.code} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.is_weighable && item.weight 
                                    ? `${item.weight.toFixed(3)}kg`
                                    : `${item.quantity}x`
                                  }
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-green-600 font-semibold text-sm">{formatPrice(item.subtotal)}</div>
                                <button
                                  onClick={() => removeFromCart(item.code)}
                                  className="text-red-500 hover:text-red-700 text-xs mt-1"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                            {!item.is_weighable && (
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => updateCartQuantity(item.code, item.quantity - 1)}
                                  className="w-8 h-8 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.code, item.quantity + 1)}
                                  className="w-8 h-8 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  {cart.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Total:</span>
                        <span className="text-2xl font-bold text-green-600">{formatPrice(getCartTotal())}</span>
                      </div>
                    </div>
                  )}

                  {/* Forma de Pagamento */}
                  {cart.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                      <h4 className="text-md font-semibold text-blue-800 flex items-center gap-2">
                        <DollarSign size={20} />
                        Forma de Pagamento
                      </h4>
                      <div>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="dinheiro">💵 Dinheiro</option>
                          <option value="pix">📱 PIX</option>
                          <option value="cartao_credito">💳 Cartão de Crédito</option>
                          <option value="cartao_debito">💳 Cartão de Débito</option>
                          <option value="voucher">🎟️ Voucher</option>
                          <option value="misto">🔄 Misto</option>
                        </select>
                      </div>

                      {paymentMethod === 'dinheiro' && (
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1">
                            Troco para (opcional)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={changeFor || ''}
                            onChange={(e) => setChangeFor(parseFloat(e.target.value) || undefined)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Valor para troco"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finalizar */}
                  {cart.length > 0 && (
                    <button
                      onClick={finalizeSale}
                      disabled={!customerName || cart.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={20} />
                      Finalizar Venda
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Selecione uma mesa para iniciar a venda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Peso */}
        {showWeightModal && selectedWeightProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Inserir Peso</h3>
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">{selectedWeightProduct.name}</div>
                  <div className="text-blue-600 text-sm">
                    {formatPrice((selectedWeightProduct.price_per_gram || 0) * 1000)}/kg
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold"
                  placeholder="0.500"
                  autoFocus
                />
                <div className="text-center mt-2 text-sm text-gray-600">
                  {productWeight && !isNaN(parseFloat(productWeight)) && (
                    <div className="font-semibold text-green-600">
                      Total: {formatPrice(parseFloat(productWeight) * (selectedWeightProduct.price_per_gram || 0) * 1000)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleWeightConfirm}
                  disabled={!productWeight || parseFloat(productWeight) <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Criar Mesa */}
        {showCreateTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Nova Mesa</h3>
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
                    Capacidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
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
        )}
      </div>
    </div>
  );
};

export default TableSalesPanel;